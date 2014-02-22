/**
@author Oliver Zhou 2013
*/

var app = angular.module("myApp", ['Common', 'Security', 'Test', 'HumanTask', 'ProcessInstance']);

app.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: "modules/human-task/work-list.html",
    controller: 'WorkListCtrl'
  })
  .otherwise({
    redirectTo: '/'
  });
});

app.config(function($logProvider) {
  $logProvider.debugEnabled(false);
});

