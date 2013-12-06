var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());
var Datastore = require('nedb');
var Q = require('q');
var joint = require('jointjs');
var dagre = require('dagre');
var layoutHelper = require('./lib/joint.layout.DirectedGraph.js');

var definitionCollection = new Datastore();
/**
* [CORE] Task Definition: Represent a abstract task in the process definition
*/
function Task(type) {
  this.id = null;
  this.name = null;
  this.type = type;
  this.incomingFlows = [];
  this.outgoingFlows = [];
}

Task.prototype.serialize = function () {
  function handleFlow(flow) {
    return {
        from: flow.from.id,
        to: flow.to.id,
        condition: flow.condition ? flow.condition.toString() : null
      };
  }
  var entity = {
    id: this.id,
    name: this.name,
    type: this.type,
    incomingFlows: this.incomingFlows.map(function (flow) {
      return handleFlow(flow);
    }),
    outgoingFlows: this.outgoingFlows.map(function (flow) {
      return handleFlow(flow);
    })
  };
  return entity;
};

Task.prototype.deserialize = function (entity) {
  this.id = entity.id;
  this.name = entity.name;
  this.type = entity.type;
};

/**
 * A factory method for deserialize the all kinds of Task
 * The subclass must provide a deserialize method in its prototype for extension
 * @param  {[TaskEntity]} entity
 * @return {[Task]}
 */
Task.deserialize = function (entity) {
  var task = processBuilder.createTask(entity.type);
  task.deserialize(entity);
  return task;
};

Task.prototype.render = function () {
  var circle = new joint.shapes.basic.Circle({
    //position: { x: 100, y: 30 },
    size: { width: 30, height: 30 },
    attrs: { circle: {fill: this.type == 'start-task' ? 'red' : 'green'} }
  });

  return circle;
};

/**
 * Exclusive Gateway
 */
function Decision() {
  Decision.super_.apply(this, arguments);
  this.type = 'decision';
}
util.inherits(Decision, Task);

var DecisionElement = joint.dia.Element.extend({

  markup: '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text/></g>',

  defaults: joint.util.deepSupplement({

    type: 'basic.Decision',
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

Decision.prototype.render = function () {
  var decision = new DecisionElement({
    //position: { x: 320, y: 25},
    size: {width: 70, height: 40},
    attrs: {text: {text: this.name ? this.name : 'decision'}}
  });

  return decision;
};

function ServiceTask(action) {
  ServiceTask.super_.apply(this, arguments);
  this.type = 'service-task';
  this.action = action;
}
util.inherits(ServiceTask, Task);

ServiceTask.prototype.render = function () {
  var service = new joint.shapes.basic.Rect({
      //position: { x: 180, y: 30 },
      size: { width: 100, height: 30 },
      attrs: { rect: { fill: 'blue' }, text: { text: this.name ? this.name : 'service', fill: 'white' } }
    });
  return service;
};

ServiceTask.prototype.serialize = function () {
  var entity = ServiceTask.super_.prototype.serialize.call(this);
  entity.action = this.action.toString();
  return entity;
};

ServiceTask.prototype.deserialize = function (entity) {
  ServiceTask.super_.prototype.deserialize.call(this, entity);
  eval('this.action = ' + entity.action);
};


/**
 * The factory class to create different kinds of tasks for the client
 */
function ProcessBuilder() {
  this.startTask = function () {
    return new Task('start-task');
  };
  this.endTask = function () {
    return new Task('end-task');
  };
}
ProcessBuilder.prototype.registerTask = function (type, Task) {
  this[_.camelize(type)] = function () {
    var task = new Task();
    Task.apply(task, arguments);
    return task;
  };
};
ProcessBuilder.prototype.createTask = function (type) {
  return this[_.camelize(type)]();
};
var processBuilder = new ProcessBuilder();


/**
 * [CORE] The definiton of the process which can be executed by process engine
 */
function ProcessDefinition(name) {
  this.name = name;
  this.tasks = {};
  this.nextTaskId = 0;
  this.layout = null;
  this.variables = {};
}

ProcessDefinition.prototype.addTask = function (task) {
  var id = task.id ? task.id : this.nextTaskId++;
  task.id = id;
  this.tasks[id] = task;
};
/**
 * create a flow
 * 
 * @param {[task]} taskFrom
 * @param {[task]} taskTo
 * @param {[function]} condition
 */
ProcessDefinition.prototype.addFlow = function (taskFrom, taskTo, condition) {
  var flow = {
    from: taskFrom,
    to: taskTo,
    condition: condition
  };
  taskTo.incomingFlows.push(flow);
  taskFrom.outgoingFlows.push(flow);
};

ProcessDefinition.prototype.serialize = function () {
  var tasks = [];
  _.forOwn(this.tasks, function (task) {
    tasks.push(task.serialize());
  }, this);

  var layout;
  if (this.layout)
    layout = _.isString(this.layout) ? this.layout : JSON.stringify(this.layout.toJSON());
  else
    layout = JSON.stringify(this.render().toJSON());

  var entity = {
    _id: this._id,
    name: this.name,
    tasks: tasks,
    layout: layout,
    variables: this.variables
  };

  return entity;
};

ProcessDefinition.deserialize = function (entity) {
  var def = new ProcessDefinition();
  def._id = entity._id;
  def.name = entity.name;
  def.variables = entity.variables;
  if (entity.layout) {
    var graph = new joint.dia.Graph();
    graph.fromJSON(JSON.parse(entity.layout));
    def.layout = graph;
  }
  entity.tasks.forEach(function (taskEntity) {
    def.addTask(Task.deserialize(taskEntity));
  });

  entity.tasks.forEach(function (taskEntity) {
    function deserializeFlow(flow) {
      var deserializedFlow = {
        from: def.tasks[flow.from],
        to: def.tasks[flow.to]
      };
      eval('deserializedFlow.condition = ' + flow.condition);
      return deserializedFlow;
    }

    def.tasks[taskEntity.id].incomingFlows = taskEntity.incomingFlows.map(function (flow) {
      return deserializeFlow(flow);
    });
    def.tasks[taskEntity.id].outgoingFlows = taskEntity.outgoingFlows.map(function (flow) {
      return deserializeFlow(flow);
    });
  });

  return def;
};

ProcessDefinition.prototype.save = function () {
  var entity = this.serialize();
  if (entity._id)
    return Q.ninvoke(definitionCollection, 'update', {'_id': entity._id}, entity, {}).then(function() {
      return entity;
    });
  else
    return Q.ninvoke(definitionCollection,'insert', entity).then(function (entity) {
      this._id = entity._id;
      return this;
    }.bind(this));
};

ProcessDefinition.load = function (id) {
  return Q.ninvoke(definitionCollection, 'findOne', {'_id': id}).then(function (entity) {
    return ProcessDefinition.deserialize(entity);
  });
};

ProcessDefinition.query = function (conditions) {
  return Q.ninvoke(definitionCollection, 'find', conditions);
};

/**
 * Create JointJS Graph and then use Dagre to do automatic layout
 * @return {joint.dia.Graph}
 */
ProcessDefinition.prototype.render = function () {
  var graph = new joint.dia.Graph();

  _.forOwn(this.tasks, function (task) {
    var cell = task.render();
    graph.addCell(cell);
    task.cell = cell;
  }, this);

  _.forOwn(this.tasks, function (task) {
    task.outgoingFlows.forEach(function (flow) {
      var link = new joint.dia.Link({
        source: { id: flow.from.cell.id },
        target: { id: flow.to.cell.id },
        manhattan: true,
        toolMarkup: '<g></g>',
        // labels: [
        //   { position: 0.6, attrs: { text: { text: 'Yes', fill: 'brown', 'font-family': 'sans-serif' }}}
        // ]
        attrs: {
          '.marker-target': {
              d: 'M 10 0 L 0 5 L 10 10 z'
            }
          }
        });
      graph.addCell(link);
    });
  }, this);

  layoutHelper.layout(graph, { setLinkVertices: false, rankDir: 'LR', rankSep: 50 });
  //console.log(graph.toJSON());
  return graph;
};


module.exports = {
  ProcessDefinition: ProcessDefinition,
  processBuilder: processBuilder,
  Task: Task,
  ServiceTask: ServiceTask,
  Decision: Decision
};

