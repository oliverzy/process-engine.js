var module = angular.module("HumanTask", ['ProcessInstance']);

module.config(function($routeProvider) {
  $routeProvider.when('/worklist', {
    templateUrl: "modules/human-task/work-list.html",
    controller: 'WorkListCtrl'
  });
});

module.controller('WorkListCtrl', function($scope, $http) {
  $scope.STATUS = ['All', 'New', 'Reserved', 'In Progress', 'Completed'];
  $scope.result = {};
  $scope.changeStatus = function (status) {
    var queryParam = {
      status: status
    };
    if (status === 'All')
      delete queryParam.status;
    $scope.currentStatus = status;
    $scope.currentTask = null;
    $http.get('api/worklist', {params: queryParam}).success(function(data) {
      $scope.worklist = data;
    });
  };

  $scope.claim = function (task) {
    $http.post('api/worklist/claim', {id: task._id}).success(function () {
      $scope.changeStatus('In Progress');
    });
  };

  $scope.complete = function (task) {
    $http.post('api/worklist/complete', {id: task._id, variables: $scope.result.variables}).success(function () {
      $scope.changeStatus('Completed');
    });
  };

  $scope.startWorking = function (task) {
    $http.post('api/worklist/startWorking', {id: task._id}).success(function () {
      $scope.changeStatus('In Progress');
    });
  };

  $scope.view = function (task) {
    $scope.currentTask = task;
    $scope.editible = (task.status === 'In Progress');
  };

  $scope.changeStatus('All');
});
