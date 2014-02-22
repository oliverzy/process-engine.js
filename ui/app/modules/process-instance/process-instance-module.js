var module = angular.module("ProcessInstance", ['ProcessDefinition']);

module.config(function($routeProvider) {
  $routeProvider.when('/processes', {
    templateUrl: "modules/process-instance/process-instances.html",
    controller: 'ProcessInstancesCtrl'
  });
});

module.controller('ProcessInstancesCtrl', function ($scope, $http) {
  $scope.currentDef = null;
  $http.get('api/process-definitions').success(function(data) {
    $scope.defs = data;
  });

  $scope.view = function (instance) {
    $scope.currentInstance = instance;
  };

  function getInstances() {
    $http.get('api/process-instances').success(function (data) {
      $scope.instances = _.map(data, function (instance) {
        var def = _.find($scope.defs, function (def) { return def._id === instance.def; });
        instance.def = def.name;
        return instance;
      });
    });
  }

  getInstances();
});
