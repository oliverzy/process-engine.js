var module = angular.module("HumanTask", ['ProcessInstance']);

module.config(function($routeProvider) {
  $routeProvider.when('/worklist', {
    templateUrl: "modules/human-task/work-list.html",
    controller: 'WorkListCtrl'
  });
});

function createSampleGraph() {
  var graph = new joint.dia.Graph();
  var start = new joint.shapes.basic.Circle({
    position: { x: 100, y: 30 },
    size: { width: 30, height: 30 },
    attrs: { circle: {fill: 'red'} }
  });
  var service = new joint.shapes.basic.Rect({
      position: { x: 180, y: 30 },
      size: { width: 100, height: 30 },
      attrs: { rect: { fill: 'blue' }, text: { text: 'service', fill: 'white' } }
    });
  var link = new joint.dia.Link({
      source: { id: start.id },
      target: { id: service.id }
    });

  var decision = new joint.shapes.basic.Decision({
    position: { x: 320, y: 25},
    size: {width: 70, height: 40}
  });
  var link2 = new joint.dia.Link({
      source: { id: service.id },
      target: { id: decision.id },
    });

  var human1 = service.clone();
  human1.get('attrs').rect.fill = 'gray';
  human1.get('attrs').text.text = 'human1';
  human1.translate(260);
  var link3 = new joint.dia.Link({
      source: { id: decision.id },
      target: { id: human1.id },
      manhattan: true,
      labels: [
        { position: 0.5, attrs: { text: { text: 'No', fill: 'brown', 'font-family': 'sans-serif' }}}
      ]
    });
  
  var end = new joint.shapes.basic.Circle({
    position: { x: 600, y: 30 },
    size: { width: 30, height: 30 },
    attrs: { circle: {fill: 'green'} }
  });
  var link4 = new joint.dia.Link({
      source: { id: human1.id },
      target: { id: end.id }
    });

  var human2 = human1.clone();
  human2.get('attrs').text.text = 'human2';
  human2.translate(0, 50);
  var link5 = new joint.dia.Link({
      source: { id: decision.id },
      target: { id: human2.id },
      manhattan: true,
      labels: [
        { position: 0.6, attrs: { text: { text: 'Yes', fill: 'brown', 'font-family': 'sans-serif' }}}
      ]
    });

  var end2 = end.clone();
  end2.translate(0, 50);
  var link6 = new joint.dia.Link({
      source: { id: human2.id },
      target: { id: end2.id }
    });

  graph.addCells([start, service, link, decision, link2, human1, link3, end, link4, human2, link5, end2, link6]);
  //joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false, rankDir: 'LR', rankSep: 50 });
  //console.log(JSON.stringify(graph.toJSON()));
  return graph;
}

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
