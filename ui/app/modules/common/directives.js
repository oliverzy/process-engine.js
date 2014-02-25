var module = angular.module("Common.Directives", []);

module.directive('bsNavbar', function($location) {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs, controller) {
      // Watch for the $location
      scope.$watch(function() {
        return $location.path();
      }, function(newValue, oldValue) {

        $('li[data-match-route]', element).each(function(k, li) {
          var $li = angular.element(li),
            // data('match-rout') does not work with dynamic attributes
            pattern = $li.attr('data-match-route'),
            regexp = new RegExp('^' + pattern + '$', ['i']);

          if (regexp.test(newValue)) {
            $li.addClass('active');
          } else {
            $li.removeClass('active');
          }

        });
      });
    }
  };
});

module.directive('processDiagram', function ($compile, $http){
  return {
    restrict: 'E',
    scope: {
      def: '='
    },
    templateUrl: 'modules/common/process-diagram.html',
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
            },
            out: function(canvas, element, contextObject){
            }
          }
        };
        
        var baseUrl = window.document.location.protocol + "//" + window.document.location.host + "/" + "api";
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
    templateUrl: 'modules/common/process-variables.html',
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
