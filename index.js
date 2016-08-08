var actions = {};

var extensionFolder = studio.extension.getFolder();

var filesExtsForTagsReplacement = [
  'waSolution',
  'waSettings',
  'waProject',
  'json',
  'xml',
  'project'
];

function addTemplatePart(config) {
  try {
    var templateTags = config.template && config.template.tags ? config.template.tags : [];
    var templateTagsExtensions = config.template && config.template.extensions ? config.template.extensions : filesExtsForTagsReplacement;
    var sourceTemplateRelativePath = getTemplatePartPosix({
      path: config.source.path,
      name: config.source.name
    }, true);
    var destinationTemplateFolder = Folder(config.destination.path);
    if (!destinationTemplateFolder.exists) {
      destinationTemplateFolder.create();
    }
    studio.extension.addPartsFromTemplate({
      destinationPath: destinationTemplateFolder.path,
      partsTemplate: sourceTemplateRelativePath,
      replacements: templateTags,
      extensions: templateTagsExtensions
    });
  } catch(err) {
    studio.log(err);
  }
}

function addTemplateToProject(templateName, projectFolder, type, params) {
  try {
    addTemplatePart({
      source: {
        name: templateName,
        path: type + '/'
      },
      destination: {
        path: Folder(projectFolder.path + type + '/').path
      },
      template: {
        tags: [
          { "marker": "$(solutionName)", "toReplace": params.name },
          { "marker": "$(projectName)", "toReplace": params.name }
        ]
      },
      extensions: filesExtsForTagsReplacement
    });
  } catch(err) {
    studio.log(err);
  }
}

function getTemplatePartPosix(params, relative) {
  var relativePath = params.path + params.name + '/';
  var absolutePath = extensionFolder.path + relativePath;
  var templateFolder = studio.Folder(absolutePath);
  if (!templateFolder.exists) {
    studio.alert("Template folder doesn't exist");
    return false;
  }
  return relative ? relativePath : templateFolder.path;
}

function getDefaultSolutionFolder() {
  var wakandaFolder = Folder('WAKANDA_FOLDER');
  if (!wakandaFolder.exists) {
    var extensionFolder = Folder('EXTENSIONS_USER');
    wakandaFolder = Folder(extensionFolder.path).parent;
  }
  var solutionsFolderPath = wakandaFolder.path + 'solutions';
  var createSolutionFolder = Folder(solutionsFolderPath).create();
  if (createSolutionFolder) {
    return Folder(solutionsFolderPath);
  }
  return wakandaFolder;
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

function getSolutionTagsFromSolutionParams(solutionParams) {
  var solutionTags = [
    { marker: '$(solutionName)', toReplace: solutionParams.name }
  ];
  var projectPathTag = { 
    marker: '$(projectPath)',
    toReplace: ''
  };
  if (solutionParams.withProject === 'true') {
    projectPathTag.toReplace = '<project path="../' + solutionParams.name + '/' + solutionParams.name + '.waProject"/>';
  }
  solutionTags.push(projectPathTag);
  
  return solutionTags;
}

function getProjectTagsFromSolutionParams(solutionParams) {
  var projectSettingsPort = 8081;
  if (studio.currentSolution) {
    var solutionProjects = studio.currentSolution.getProjects();
    if (solutionProjects) {
      projectSettingsPort = projectSettingsPort + solutionProjects.length;
    }
  }
  var projectTags = [
    { "marker": "$(projectName)", "toReplace": solutionParams.name },
    { "marker": "$(port)", "toReplace": String(projectSettingsPort) }
  ];

  // mobileFolder optional tag
  var mobilePathTag = { 
    marker: '$(mobileFolderTag)',
    toReplace: ''
  };
  if (solutionParams.mobile === true && solutionParams.mobileTemplateName.length > 0) {
    mobilePathTag.toReplace = '<folder path="./mobile/"><tag name="mobileFolder"/></folder>';
  }
  projectTags.push(mobilePathTag);

  // webFolder optional tag
  var webPathTag = { 
    marker: '$(webFolderTag)',
    toReplace: ''
  };
  if (solutionParams.web === true && solutionParams.webTemplateName.length > 0) {
    webPathTag.toReplace = '<folder path="./web/"><tag name="webFolder"/></folder>';
  } else if (solutionParams.mobile === true && solutionParams.mobileTemplateName.length > 0) {
    webPathTag.toReplace = '<folder path="./mobile/www/"><tag name="webFolder"/></folder>';
  } else {
    webPathTag.toReplace = '<folder path="./web/"><tag name="webFolder"/></folder>';
  }
  projectTags.push(webPathTag);

  return projectTags;
}

actions.showCreateSolutionDialog = function(params) {
  // reset returnValue object
  studio.extension.storage.returnValue = {};

  var wakandaSolutionsFolder = getDefaultSolutionFolder();
  var solutionName = getDefaultSolutionName(wakandaSolutionsFolder);

  studio.extension.showModalDialog(
    // dialog template
    "solutionDialog.html",
    // options
    {
      name: solutionName,
      path: wakandaSolutionsFolder.path,
      mobile: true,
      web: true,
      templatesPath: extensionFolder.path
    }, 
    // dialog config
    {
      title: "New solution",
      dialogwidth: 845,
      dialogheight: 745,
      resizable: false
    },
    // callback function
    'createSolution'
  );

  return false;
}

actions.showAddProjectDialog = function(params) {
  // reset returnValue object
  studio.extension.storage.returnValue = {};

  var solutionName = studio.currentSolution.getSolutionName();
  var solutionFile = studio.currentSolution.getSolutionFile();
  var solutionFolder = solutionFile.parent.parent;
  var projectName = getDefaultSolutionName(solutionFolder);

  studio.extension.showModalDialog(
    // dialog template
    "projectDialog.html",
    // options
    {
      name: projectName,
      path: solutionFolder.path,
      mobile: true,
      web: true,
      templatesPath: extensionFolder.path
    }, 
    // dialog config
    {
      title: "New project",
      dialogwidth: 845,
      dialogheight: 745,
      resizable: false
    },
    // callback function
    'createProject'
  );

  return false;
};

actions.createSolution = function(params) {
  var solutionParams = params || studio.extension.storage.returnValue; // gets values from the dialog   
  if (!solutionParams || !solutionParams.path) {
    return false;
  }

  if (!solutionParams.name || solutionParams.name.length < 1) {
    var parentSolutionsFolder = Folder(solutionParams.path);
    solutionParams.name = getDefaultSolutionName(parentSolutionsFolder);
  }

  // add solution template part
  var solutionTemplateName = solutionParams.solutionTemplateName || 'default';
  var solutionFolder = Folder(solutionParams.path + solutionParams.name);
  var solutionTags = getSolutionTagsFromSolutionParams(solutionParams);
  addTemplatePart({
    source: {
      name: solutionTemplateName,
      path: 'solution/'
    },
    destination: {
      path: solutionFolder.path
    },
    template: {
      tags: solutionTags
    }
  });

  // add project template part
  var projectTemplateName = solutionParams.projectTemplateName || 'default';
  var projectFolder = Folder(solutionFolder.path + solutionParams.name);
  if (solutionParams.withProject === 'true') {
    var projectTags = getProjectTagsFromSolutionParams(solutionParams);
    addTemplatePart({
      source: {
        name: projectTemplateName,
        path: 'project/'
      },
      destination: {
        path: projectFolder.path
      },
      template: {
        tags: projectTags
      }
    });
  }
  
  // add web part
  if (solutionParams.web === true && solutionParams.webTemplateName.length > 0) {
    addTemplateToProject(solutionParams.webTemplateName, projectFolder, 'web', solutionParams);
    if (solutionParams.withPrototype === 'true') {
      var prototypeTemplateName = solutionParams.prototypeTemplateName || 'default';
      addTemplateToProject(prototypeTemplateName, Folder(projectFolder.path + 'web'), 'prototype', solutionParams);
    }
  }

  // add mobile part
  if (solutionParams.mobile === true && solutionParams.mobileTemplateName.length > 0) {
    addTemplateToProject(solutionParams.mobileTemplateName, projectFolder, 'mobile', solutionParams);
  }

  var solutionFile = File(solutionFolder.path + solutionParams.name + ' Solution/' + solutionParams.name + '.waSolution');
  if (solutionFile.exists) {
    studio.openSolution(solutionFile.path);
  }
};

actions.createProject = function(params) {
  var projectParams = params || studio.extension.storage.returnValue; // gets values from the dialog   
  if (!projectParams) {
    return false;
  }
  
  if (!projectParams.name || projectParams.name.length < 1) {
    var parentSolutionsFolder = Folder(projectParams.path);
    projectParams.name = getDefaultSolutionName(parentSolutionsFolder);
  }

  // add project template part
  var projectTemplateName = projectParams.projectTemplateName || 'default';
  var projectFolder = Folder(projectParams.path + projectParams.name);
  var projectTags = getProjectTagsFromSolutionParams(projectParams);
  addTemplatePart({
    source: {
      name: projectTemplateName,
      path: 'project/'
    },
    destination: {
      path: projectFolder.path
    },
    template: {
      tags: projectTags
    }
  });

  // add web part
  if (projectParams.web === true && projectParams.webTemplateName.length > 0) {
    addTemplateToProject(projectParams.webTemplateName, projectFolder, 'web', projectParams);
    if (projectParams.withPrototype === 'true') {
      var prototypeTemplateName = projectParams.prototypeTemplateName || 'default';
      addTemplateToProject(prototypeTemplateName, Folder(projectFolder.path + 'web'), 'prototype', projectParams);
    }
  }

  // add mobile part
  if (projectParams.mobile === true && projectParams.mobileTemplateName.length > 0) {
    addTemplateToProject(projectParams.mobileTemplateName, projectFolder, 'mobile', projectParams);
  }

  var waProjectFile = File(projectFolder.path + projectParams.name + '.waProject');
  if (waProjectFile.exists) {
    studio.addExistingProject(waProjectFile.path);
  }
};

exports.handleMessage = function handleMessage(message) {
  "use strict";

  var actionName = message.action;
  var params = message.params;

  if (!actions.hasOwnProperty(actionName)) {
    studio.alert("Unknown command: " + actionName);
    return false;
  }
  actions[actionName](params);
};

// copyFolder is a recursive function
// because DirectoryEntrySync that can copy folder is not implemented in the studio
// the function is working in absolute path
function copyFolder(source, destination, toExclude) {
  var folder = new Folder(source);
  if(! folder.exists) {
    return;
  }

  var destFolder = Folder(destination);
  if(! destFolder.exists) {
    destFolder.create();
  }

  toExclude = toExclude || {};

  if(destination.slice(-1) !== '/') {
    destination += '/';
  }

  folder.files.forEach(function(_file) {
    if(toExclude.files && toExclude.files.indexOf(_file.path) === -1) {
      _file.copyTo(destination + _file.name);
    }
  });

  folder.folders.forEach(function(_folder) {
    if(toExclude.folders && toExclude.folders.indexOf(_folder.path) === -1) {
     copyFolder(_folder.path, destination + _folder.name, toExclude);
   }
 });
}