var module = angular.module("ProcessDefinition", ['Common']);

module.config(function($routeProvider) {
  $routeProvider.when('/definitions', {
    templateUrl: "modules/process-definition/process-definition.html",
    controller: 'ProcessDefinitionCtrl'
  });
});

joint.shapes.basic.Decision = joint.dia.Element.extend({

  markup: '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text/></g>',

  defaults: joint.util.deepSupplement({

    type: 'Decision',
    size: {
      width: 80,
      height: 80
    },
    attrs: {
      '.outer': {
        fill: '#3498DB',
        stroke: '#2980B9',
        'stroke-width': 2,
        points: '40,0 80,40 40,80 0,40'
      },
      '.inner': {
        fill: '#3498DB',
        stroke: '#2980B9',
        'stroke-width': 2,
        points: '40,5 75,40 40,75 5,40',
        display: 'none'
      },
      text: {
        text: 'Decision',
        'font-family': 'Arial',
        'font-size': 12,
        ref: '.',
        'ref-x': 0.5,
        'ref-y': 0.5,
        'x-alignment': 'middle',
        'y-alignment': 'middle'
      }
    }

  }, joint.dia.Element.prototype.defaults)
});

module.directive('processDef', function ($compile, $http){
  return {
    restrict: 'E',
    scope: {
      def: '=',
      width: '@',
      height: '@'
    },
    compile: function(tElement, tAttrs, transclude) {
      return function($scope, iElm, iAttrs, scrollableCtrl) {
        function createGraph(def) {
          iElm.empty();
          iElm.append('<button ng-show="def" ng-click="saveLayout()" class="btn btn-default pull-right"><i class="fa fa-white fa-save"></i> Save</button>');
          $compile(iElm)($scope);
          var graph;
          if (def.layout instanceof joint.dia.Graph) {
            graph = def.layout;
          } else {
            graph = new joint.dia.Graph();
            graph.fromJSON(_.extend({}, JSON.parse(def.layout)));
          }
          var paper = new joint.dia.Paper({
            el: iElm,
            width: $scope.width ? $scope.width : 800,
            height: $scope.height ? $scope.height : 100,
            gridSize: 5,
            model: graph
          });
          paper.resetCells(graph.get('cells'));

          $scope.saveLayout = function () {
            def.layout = JSON.stringify(graph.toJSON());
            console.log(def.layout);
            $http.post('api/process-definitions', def).success(function () {
              toastr.success('Update Successfully', null, {
                positionClass: 'toast-bottom-right'
              });
            });
          };
        }

        $scope.$watch('def', function(newValue, oldValue) {
          if (newValue)
            createGraph(newValue);
        });
      };
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
