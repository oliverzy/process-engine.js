var module = angular.module("ProcessDefinition", ['Common']);

module.config(function($routeProvider) {
  $routeProvider.when('/definitions', {
    templateUrl: "modules/process-definition/process-definition.html",
    controller: 'ProcessDefinitionCtrl'
  });
});

module.controller('ProcessDefinitionCtrl', function ($scope, $http, ngTableParams, $filter) {
  $scope.currentDef = null;
  $scope.result = {};
  $http.get('api/process-definitions').success(function(data) {
    $scope.defs = data;

    $scope.tableParams = new ngTableParams({
      page: 1,
      count: 10,
      sorting: {
        name: 'asc'
      }
    }, {
      total: data.length,
      groupBy: 'category',
      getData: function($defer, params) {
        var orderedData = params.sorting() ?
                            $filter('orderBy')(data, params.orderBy()) :
                            data;
        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });
  });

  $scope.view = function (def) {
    $scope.currentDef = def;
  };

  $scope.start = function (def) {
    //console.log($scope.result.variables);
    $http.post('api/process-definitions/' + def._id + '/start', $scope.result.variables).success(function (data) {
      toastr.success(data.id + ': Start Successfully', null, {
        positionClass: 'toast-bottom-right'
      });
    });
  };

});
