/* jshint node: true */

var _ = require('lodash');
var dagre = require("dagre");

function createActivity(task) {
  var activity = {
    activityId: 'task' + task.id,
    properties: {
      name: task.name,
    }
  };

  if (task.type == 'start-task') {
    activity.properties.type = 'startEvent';
    activity.width = activity.height = 36;
  } else if (task.type == 'end-task') {
    activity.properties.type = 'endEvent';
    activity.width = activity.height = 36;
  } else if (task.type == 'service-task') {
    activity.properties.type = 'serviceTask';
    activity.width = 100;
    activity.height = 80;
  } else if (task.type == 'decision') {
    activity.properties.type = 'exclusiveGateway';
    activity.width = activity.height = 50;
  } else if (task.type == 'human-task') {
    activity.properties.type = 'userTask';
    activity.width = 100;
    activity.height = 80;
  }

  return activity;
}

function createDiagramModel(processDefinition) {
  var diagramModel = {};
  diagramModel.processDefinition = {
    id: processDefinition._id || processDefinition.name,
    isGraphicNotationDefined: true,
    //key: processDefinition.key,
  };

  diagramModel.activities = _.map(processDefinition.tasks, function (task) {
    return createActivity(task);
  });

  var flowId = 0;
  diagramModel.sequenceFlows = _(processDefinition.tasks).map(function (task) {
    return _.map(task.outgoingFlows, function (flow) {
      flowId++;
      return {
        flow: '(task' + flow.from.id + ')' + '--flow' + flowId + '-->' + '(task' + flow.to.id + ')',
        from: 'task' + flow.from.id,
        to: 'task' + flow.to.id,
        id: 'flow' + flowId,
        xPointArray: [],
        yPointArray: [],
        isConditional: !!flow.condition,
        condition: flow.condition ? flow.condition.toString() : null
      };
    });
  }).flatten().value();

  return diagramModel;
}

function doLayout(diagramModel) {
  var g = new dagre.Digraph();
  _.each(diagramModel.activities, function (activity) {
    g.addNode(activity.activityId, {width: activity.width, height: activity.height});
  });
  _.each(diagramModel.sequenceFlows, function (flow) {
    g.addEdge(flow.id, flow.from, flow.to);
  });

  var layout = dagre.layout().nodeSep(20).rankDir("LR").run(g);
  _.each(diagramModel.activities, function (activity) {
    activity.x = layout.node(activity.activityId).x - activity.width / 2;
    activity.y = layout.node(activity.activityId).y - activity.height / 2;
  });
  _.each(diagramModel.sequenceFlows, function (flow) {
    flow.xPointArray.push(layout.node(flow.from).x);
    flow.yPointArray.push(layout.node(flow.from).y);
    var points = layout.edge(flow.id).points;
    _.each(points, function (point) {
      flow.xPointArray.push(point.x);
      flow.yPointArray.push(point.y);
    });
    flow.xPointArray.push(layout.node(flow.to).x);
    flow.yPointArray.push(layout.node(flow.to).y);

    delete flow.from;
    delete flow.to;
  });
}

var engineAPI = {
  getDiagramModel: function (processDefinition) {
    var diagramModel = createDiagramModel(processDefinition);
    doLayout(diagramModel);
    return diagramModel;
  }
};

module.exports = {
  API: engineAPI
};

