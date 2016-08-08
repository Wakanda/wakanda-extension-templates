(function() {
  var defaultTemplates = {
    mobile: 'ionic1-tabs-template',
    web: 'angular1-gulp'
  };

  var sortByAttribute = function(attributeName) {
    return function(a, b) { 
      if (a[attributeName] < b[attributeName]) {
        return -1;
      } else {
        return 1;
      }
      return 0;
    };
  };    

  function getTemplateInfoFromFolder(folder) {
    var template = {
      name: folder.name,
      description: '',
      tags: [],
      tagsHTML: ''
    };
    folder.folders.forEach(function(subFolder) {
      if (subFolder.name === '.wakanda') {
        subFolder.files.forEach(function(file) {
          if (file.name === 'manifest.json') {
            var configFile = file.toString();
            var config = {};
            try {
              config = JSON.parse(configFile);
            } catch(err) {
              studio.log(file.name + '\'s .wakanda config file is an invalid JSON');
            }
            template.name = config.name || template.name;
            template.description = config.description || template.description;
            template.tags = config.tags || template.tags;
          }
        });
      }
    });
    template.tags.forEach(function(el) { 
      template.tagsHTML += '<span class="form__template-preview-tag">'+el+'</span>';
    });
    return template;
  }

  function addTemplatePreview(containerSelector, templateFolder, isVisible) {
    var template = getTemplateInfoFromFolder(templateFolder);
    var $container = $(containerSelector);
    $container.find('.form__template-preview').append(
    '<div data-id="' + templateFolder.name + '" class="form__template-preview-box" style="display:' + (isVisible ? 'block' : 'none') + ';">'
    + '<p class="form__template-preview-desc">' + template.description + '</p>'
    + template.tagsHTML
    +'</div>'
    );
    $container.find('.form__select').append(
     '<option value="' + templateFolder.name + '">'
    +  template.name
    +'</option>'
    );
  }

  var mobileTemplatesFolder = studio.Folder(studio.extension.storage.dialogArguments.templatesPath + 'mobile');
  if (mobileTemplatesFolder.exists) {
    var mobileTemplateFolders = mobileTemplatesFolder.folders.sort(sortByAttribute('name'));
    mobileTemplateFolders.forEach(function(folder, i) {  
      var isVisible = defaultTemplates.mobile === folder.name;    
      addTemplatePreview('#mobileTemplates', folder, isVisible);
    });
  }

  var webTemplatesFolder = studio.Folder(studio.extension.storage.dialogArguments.templatesPath + 'web');
  if (webTemplatesFolder.exists) {
    var webTemplatesFolders = webTemplatesFolder.folders.sort(sortByAttribute('name'));
    webTemplatesFolders.forEach(function(folder, i) {    
      var isVisible = defaultTemplates.web === folder.name;
      addTemplatePreview('#webTemplates', folder, isVisible);
    });
  }

  $('.form__input--button').click(function(e) {
    e.preventDefault();
    var f = studio.folderSelectDialog();
    if (f) {
      $(this).parent().find('input').val(f.path);
    }
  });

  $('.form__input, .form__toggle-input, .form__select').each(function(i, input) {
    var $input = $(input);
    var attributeName = $input.attr('name');
    if (!attributeName) {
      return;
    }
    var dialogArgumentsAttribute = studio.extension.storage.dialogArguments[attributeName];
    if (typeof dialogArgumentsAttribute === 'undefined') {
      return;
    }
    $input.val(dialogArgumentsAttribute);
  });
  
  $('.form__toggle-group').click(function(e) {
    e.preventDefault();
    var $toggleGroup = $(this);
    if ($toggleGroup.hasClass('form__toggle-group--active')) {
      $toggleGroup.removeClass('form__toggle-group--active');
      $toggleGroup.find('input').val(false);
      $toggleGroup.parent().find('select').hide(); // temp select code
    } else {
      $toggleGroup.addClass('form__toggle-group--active');
      $toggleGroup.find('input').val(true);
      $toggleGroup.parent().find('select').show(); // temp select code
    }
  });

  function toggleNextOption(inputs, prev) {
    var activeInputIndex = -1;
    $.each(inputs, function(i, el) {
      var $el = $(el);
      if ($el.prop('selected') === true) {
        $el.prop('selected', false);
        activeInputIndex = i;
      }
    });
    var nextActiveInputIndex = prev ? activeInputIndex - 1 : activeInputIndex + 1;
    if (inputs[nextActiveInputIndex]) {
      $(inputs[nextActiveInputIndex]).prop('selected', true);
    } else {
      nextActiveInputIndex = prev ? inputs.length - 1 : 0;
      $(inputs[nextActiveInputIndex]).prop('selected', true);
    }
    return nextActiveInputIndex;
  }

  function toggleTemplateContainer($container, templateNumber) {
    var $templatesContainer = $container.children('.form__template-preview');
    $templatesContainer.find('.form__template-preview-box').hide();
    $templatesContainer.find('.form__template-preview-box[data-id="' + templateNumber + '"]').show();
  }

  function checkProjectPartEnabled(container) {
    var $formGroup = $(container).closest('.form__group');
    var $projectPartToggle = $formGroup.children('.form__toggle-input');
    return $projectPartToggle.prop('checked');
  }

  function selectPreview($container, id) {
    $container.find('.form__template-preview-box').hide();
    $container.find('.form__template-preview-box[data-id="' + id + '"]').show();
  }

  function changePreview(element, prev) {
    var $templatesContainer = $(element).closest('.form__template');
    var $templateSelect = $templatesContainer.find('.form__select');
    var $activeOption = $templateSelect.find('option[value="'+$templateSelect.val()+'"]');
    var $newOption = {};
    if (prev) {
      $newOption = $activeOption.prev();
      if ($newOption.length === 0) {
        $newOption = $templateSelect.find('option').last();
      }
    } else {
      $newOption = $activeOption.next();
      if ($newOption.length === 0) {
        $newOption = $templateSelect.find('option').first();
      }
    }
    $templateSelect.val($newOption.attr('value'));
    changeSelectValue($templateSelect.next(), $newOption.attr('value'), $newOption.html());
    reloadPreview($templatesContainer);
  }
  
  function reloadPreview($templatesContainer) {
    var templateId = $templatesContainer.find('.form__select').val();
    selectPreview($templatesContainer.children('.form__template-preview'), templateId);
  }

  $('.form__select').change(function(e) {
    var $templatesContainer = $(this).closest('.form__template');
    reloadPreview($templatesContainer);
  });

  $('.form__template-input-arrow--right').click(function(e) {
    e.preventDefault();
    changePreview(this);
  });

  $('.form__template-input-arrow--left').click(function(e) {
    e.preventDefault();
    changePreview(this, true);
  });

  $('.dialog__button--submit').click(function(e) {
    e.preventDefault();
    submitDialog();
  });
  
  function checkSolution(solutionParams) {
    if (! solutionParams) {
      return false;
    }

    if (! solutionParams.name || solutionParams.name.length < 1) {
      var parentSolutionsFolder = studio.Folder(solutionParams.path);
      solutionParams.name = getDefaultSolutionName(parentSolutionsFolder);
    }

    var solutionFolder = studio.Folder(solutionParams.path + solutionParams.name);
    if(solutionFolder.exists) {
      studio.alert('This solution folder already exists. Please try again with a different name.');
      return false;
    }
    
    return true; 
  }

  function getDefaultSolutionName(folder) {
    var solutionBaseName = 'Untitled';

    var solutionNameCounter = 0;
    var solutionNameRegex = new RegExp('(' + solutionBaseName + ')(\\d+)');  
    folder.forEachFolder(function(folder) {
      var checkFolderName = solutionNameRegex.exec(folder.name);
      if (checkFolderName) {
        var solutionNameNumber = parseInt(checkFolderName[2]);
        if (solutionNameNumber > solutionNameCounter) {
          solutionNameCounter = solutionNameNumber;
        }
      }
    });
    solutionNameCounter++;
    solutionBaseName += solutionNameCounter;

    return solutionBaseName;
  }

  function submitDialog() {
    var values = {};
    $(':input').each(function(i, input) {
      var attributeName = input.getAttribute('name');
      if (!attributeName && !values[attributeName]) {
        return;
      } else if (input.getAttribute('type') === 'checkbox') {
        values[attributeName] = $(input).prop('checked');
      } else if (input.getAttribute('type') === 'radio') {
        if ($(input).prop('checked')) {
          values[attributeName] = input.value
        }
      } else if (attributeName) {
        values[attributeName] = input.value;
      }
    });
    studio.extension.storage.returnValue = values;
    
    if(! checkSolution(values)) {
      return false;
    }
    studio.extension.quitDialog();
  }

  function closeDialog() {
    studio.extension.storage.returnValue = null;
    studio.extension.quitDialog();
  }

  $('.dialog__button--cancel').click(function(e) {
    e.preventDefault();
    closeDialog();
  });
  
  // generate artificial select
  $('.form__select--dropdown').each(function(i, el) {
    var html = '<div class="form__artificial-select-container">';

    var selectHtml = '';
    var optionsHtml = '<div class="form__artificial-select-option--container" style="display:none">';

    for(var option, j = 0; option = el.options[j]; j++) {
      var optionValue = option.getAttribute('value');
      var optionText = option.innerHTML;
      var optionSelected = '';
      if(option.value == el.value) {
        optionSelected = ' form__artificial-select-option--selected';
        selectHtml = '<div data-value="'+optionValue+'" class="form__artificial-select">'+optionText+'</div>';
      }
      optionsHtml += '<div data-value="'+optionValue+'" class="form__artificial-select-option'+optionSelected+'">'+optionText+'</div>';
    }

    optionsHtml += '</div>';

    html += selectHtml + optionsHtml + '</div>';

    $(el).hide().after(html);
  });

  function changeSelectValue($container, newValue, newText) {
    $container.find('.form__artificial-select').html(newText);
    $container.prev().val(newValue).trigger('change');
    $container.find('.form__artificial-select-option').each(function(i,el) {
      var $el = $(el);
      if ($el.hasClass('form__artificial-select-option--selected')) {
        $el.removeClass('form__artificial-select-option--selected');
      }
      if (el.getAttribute('data-value') === newValue) {
        $el.addClass('form__artificial-select-option--selected');
      }
    });
    $container.find('.form__artificial-select-option--container').hide();
  }

  $('.form__artificial-select-container').hover(function() {
    // on hover
  }, function() {
    // on out
    $(this).find('.form__artificial-select-option--container').hide();
  });

  $('.form__artificial-select').click(function(e) {
    $(this).parent().find('.form__artificial-select-option--container').toggle();
    e.preventDefault();
  });

  $('.form__artificial-select-option').click(function(e) {
    var $container = $(this).closest('.form__artificial-select-container');
    var value = this.getAttribute('data-value');
    var text = this.innerHTML;
    changeSelectValue($container, value, text);
    e.preventDefault();
  });

  $('#solutionProjectName').focus();

  $(document).keypress(function(e) {
    switch(e.which) {
      case 13:
        submitDialog();
        break;
      case 27:
        closeDialog();
        break;
    }
  });
})();
