var module = angular.module("ProcessDefinition", ['Common']);

module.config(function($routeProvider) {
  $routeProvider.when('/definitions', {
    templateUrl: "modules/process-definition/process-definition.html",
    controller: 'ProcessDefinitionCtrl'
  });
});

module.directive('processDef', function ($compile, $http){
  return {
    restrict: 'E',
    scope: {
      def: '=',
      width: '@',
      height: '@'
    },
    templateUrl: 'diagram.html',
    link: function ($scope, iElm, iAttrs) {
      function createDiagram() {
        $('#diagramHolder').empty();
        var DiagramGenerator = {};
        var processDefinitionId = $scope.def._id;
        var processInstanceId = null;
        
        ProcessDiagramGenerator.options = {
          diagramBreadCrumbsId: null,
          diagramHolderId: "diagramHolder",
          diagramInfoId: null,
          pb1: {
            set: function () {}
          },
          on: {
            click: function(canvas, element, contextObject){
            },
            rightClick: function(canvas, element, contextObject){
            },
            over: function(canvas, element, contextObject){
              var mouseEvent = this;
              console.log(canvas);
              $(element.node).qtip({ // Grab some elements to apply the tooltip to
                content: {
                  text: ProcessDiagramGenerator.getActivityInfo(contextObject)
                },
                show: {
                  ready: true // Show the tooltip as soon as it's bound, vital so it shows up the first time you hover!
                }
              });
            },
            out: function(canvas, element, contextObject){
            }
          }
        };
        
        var baseUrl = window.document.location.protocol + "//" + window.document.location.host + "/";
        //var shortenedUrl = window.document.location.href.replace(baseUrl, "");
        //baseUrl = baseUrl + shortenedUrl.substring(0, shortenedUrl.indexOf("/"));
        baseUrl += 'api';
        ActivitiRest.options = {
          processInstanceHighLightsUrl: baseUrl + "/process-instances/{processInstanceId}/highlights",
          processDefinitionUrl: baseUrl + "/process-definitions/{processDefinitionId}/diagram",
          processDefinitionByKeyUrl: baseUrl + "/process-definitions/{processDefinitionKey}/diagram"
        };
        
        if (processDefinitionId) {
          ProcessDiagramGenerator.drawDiagram(processDefinitionId);
        } else {
          alert("processDefinitionId parameter is required");
        }
      }

      $scope.$watch('def', function(newValue, oldValue) {
        if (newValue)
          createDiagram(newValue);
      });
    }

  };
});

module.directive('processVariables', function () {
  return {
    restrict: 'E',
    scope: {
      // This one is an object
      processVariables: '=variables',
      result: '=',
      editible: '='
    },
    templateUrl: 'modules/process-definition/process-variables.html',
    link: function ($scope, iElm, iAttrs) {
      $scope.cancelVariable = function(index) {
        if (!$scope.variables[index].name)
          $scope.variables.splice(index, 1);
      };

      $scope.removeVariable = function(index) {
        $scope.variables.splice(index, 1);
      };

      $scope.addVariable = function() {
        $scope.inserted = {
          name: '',
          value: ''
        };
        $scope.variables.push($scope.inserted);
      };

      function convertBoolean(value) {
        if (value === 'true')
          return true;
        else if (value === 'false')
          return false;
        else
          return value;
      }

      $scope.$watch('processVariables', function (processVariables) {
        if (processVariables) {
          // This one is an array
          $scope.variables = [];
          _.forOwn(processVariables, function (value, name) {
            $scope.variables.push({
              name: name,
              value: value
            });
          });
        }
      });

      if ($scope.result) {
        $scope.$watch('variables', function (variables) {
          $scope.result.variables = {};
          _.forEach(variables, function (variable) {
            $scope.result.variables[variable.name] = convertBoolean(variable.value);
          });
        }, true);
      }
    }
  };
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
