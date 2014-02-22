var module = angular.module("Test", ['Common', 
  'localytics.directives', 'nvd3ChartDirectives']);

module.config(function($routeProvider) {
  $routeProvider.when('/test', {
    templateUrl: "modules/test/Test.html",
    controller: 'TestCtrl'
  });
});

module.controller('TestCtrl', function($scope, $http) {
  $http.get('api/name').success(function(data) {
    $scope.data = data;
  });
  
  $scope.exampleData = [
      {
          "key": "Series 1",
          "values": [ ['09/02', 36], ['09/04', 17.5], ['09/06', 11], ['09/09', 5]]
      }
  ];
});
