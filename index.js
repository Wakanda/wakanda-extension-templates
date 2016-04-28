var actions = {};

var extensionFolder = studio.extension.getFolder();

function getTemplatePartPosix(params) {
  var templatePath = extensionFolder.path + params.type + '/' + params.name;
  var templateFolder = studio.Folder(templatePath);
  if (!templateFolder.exists) {
    studio.alert("Template folder doesn't exist");
    return false;
  }
  return templateFolder.path;
}

actions.createSolution = function(params) {
  var obj = studio.openNewSolutionDialog();
  params = params || {};
  if (!obj.destinationPath) {
    return false;
  }

  var templateName = params.name || 'default';

  obj.solutionTemplate = getTemplatePartPosix({
    type: 'solution',
    name: templateName
  });

  obj.projectTemplate = getTemplatePartPosix({
    type: 'project',
    name: templateName
  });
  
  studio.extension.openSolutionFromTemplate(obj);
};

actions.createProject = function(params) {
  var obj = studio.openNewSolutionDialog();
  params = params || {};

  if (!obj.destinationPath) {
    return false;
  }

  var templateName = params.name || 'default';
  
  obj.projectTemplate = getTemplatePartPosix({
    type: 'project',
    name: templateName
  });

  studio.extension.addProjectFromTemplate(obj);
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
