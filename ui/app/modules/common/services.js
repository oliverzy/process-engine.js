var module = angular.module("Common.Services", ['ngSanitize','ui.bootstrap']);

module.factory('$dialog', ['$rootScope', '$modal', function($rootScope, $modal) {

  function dialog(modalOptions, resultFn) {
    var dialog = $modal.open(modalOptions);
    if (resultFn) dialog.result.then(resultFn);
    dialog.values = modalOptions;
    return dialog;
  }

  function modalOptions(templateUrl, controller, scope) {
    return { templateUrl:  templateUrl, controller: controller, scope: scope };
  }

  return {
    /**
     * Creates and opens dialog.
     */
    dialog: dialog,

    /**
     * Returns 0-parameter function that opens dialog on evaluation.
     */
    simpleDialog: function(templateUrl, controller, resultFn) {
      return function () { return dialog(modalOptions(templateUrl, controller), resultFn); };
    },

    /**
     * Opens simple generic dialog presenting title, message (any html) and provided buttons.
     */
    messageBox: function(title, message, buttons, resultFn) {
      if (!buttons)
        buttons = [
          {
            result: 'ok',
            label: '确定',
            cssClass: 'btn-primary'
          },
          {
            result: 'cancel',
            label: '取消',
            cssClass: 'btn-warning'
          }
        ];
      var scope = angular.extend($rootScope.$new(false), { title: title, message: message, buttons: buttons });
      return dialog(modalOptions("template/messageBox/message.html", 'MessageBoxController', scope), function (result) {
        var value = resultFn ? resultFn(result) : undefined;
        scope.$destroy();
        return value;
      });
    }
  };
}]);


module.run(["$templateCache", function($templateCache) {
  $templateCache.put("template/messageBox/message.html",
      '<div class="modal-header"><h3>{{ title }}</h3></div>\n' +
      '<div class="modal-body"><p ng-bind-html="message"></p></div>\n' +
      '<div class="modal-footer"><button ng-repeat="btn in buttons" ng-click="close(btn.result)" class="btn" ng-class="btn.cssClass">{{ btn.label }}</button></div>\n');
}]);


module.controller('MessageBoxController', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
  $scope.close = function (result) { $modalInstance.close(result); };
}]);


