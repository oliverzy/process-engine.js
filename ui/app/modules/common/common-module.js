var module = angular.module("Common", ['ngRoute', 'chieffancypants.loadingBar', "ui.bootstrap", 'xeditable', 'ngTable',
  "Common.Directives", "Common.Services"]);

module.run(function(editableOptions) {
  editableOptions.theme = 'bs3';
});