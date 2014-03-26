/**
@author Oliver Zhou 2013
*/

var app = angular.module("myApp", ['Common', 'Security', 'Test', 'HumanTask', 'ProcessInstance']);

app.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: "modules/process-definition/process-definition.html",
    controller: 'ProcessDefinitionCtrl'
  })
  .otherwise({
    redirectTo: '/'
  });
});

app.config(function($logProvider) {
  $logProvider.debugEnabled(false);
});

