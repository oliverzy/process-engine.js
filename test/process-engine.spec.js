var processEngine = require('../').processEngine;
var ProcessDefinition = require('../').ProcessDefinition;
var ProcessInstance = require('../').ProcessInstance;
var processBuilder = require('../').processBuilder;

/**
 * start -> service task -> end
 */
describe('simple process', function() {
  function createProcessDefinition() {
    var processDefinition = new ProcessDefinition();
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);
    var serviceTask = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task');
      complete();
    });
    processDefinition.addTask(serviceTask);
    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);
    processDefinition.addFlow(startTask, serviceTask);
    processDefinition.addFlow(serviceTask, endTask);

    return processDefinition;
  }

  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(createProcessDefinition());
  });

  it('should pass', function(done) {
    var events = [];
    processInstance.on('before', function (task) {
      if (task.type === 'start-task')
        events.push(task.type);
      else if (task.type === 'service-task')
        events.push(task.type);
    });
    processInstance.on('end', function () {
      expect(events[0]).toEqual('start-task');
      expect(events[1]).toEqual('service-task');
      done();
    });

    processInstance.start();
  });
});

/**
 *       ---- service task 1 ----
 *      -                        -
 * start                          end
 *      -                        -
 *       ---- service task 2 ----
 */
describe('simple parallel process', function() {
  function createProcessDefinition() {
    var processDefinition = new ProcessDefinition();
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);

    var serviceTask1 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task1');
      complete();
    });
    processDefinition.addTask(serviceTask1);

    var serviceTask2 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task2');
      complete();
    });
    processDefinition.addTask(serviceTask2);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);
    processDefinition.addFlow(startTask, serviceTask1);
    processDefinition.addFlow(startTask, serviceTask2);
    processDefinition.addFlow(serviceTask1, endTask);
    processDefinition.addFlow(serviceTask2, endTask);

    return processDefinition;
  }

  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(createProcessDefinition());
  });

  it('should pass', function(done) {
    var events = [];
    processInstance.on('before', function (task) {
      if (task.type === 'start-task')
        events.push(task.type);
      else if (task.type === 'service-task')
        events.push(task.type);
    });
    processInstance.on('end', function () {
      expect(events[0]).toEqual('start-task');
      expect(events[1]).toEqual('service-task');
      expect(events[2]).toEqual('service-task');
      done();
    });

    processInstance.start();
  });
});

/**
 *                ---- service task 1 ----
 *               -                        -
 * start - decision                         decision - end
 *               -                        -
 *                ---- service task 2 ----
 */
describe('simple exclusive gateway process', function() {
  function createProcessDefinition() {
    var processDefinition = new ProcessDefinition();
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);

    var decision = processBuilder.decision();
    processDefinition.addTask(decision);

    var serviceTask1 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task1', variables);
      complete();
    });
    processDefinition.addTask(serviceTask1);

    var serviceTask2 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task2', variables);
      complete();
    });
    processDefinition.addTask(serviceTask2);

    var decisionMerge = processBuilder.decision();
    processDefinition.addTask(decisionMerge);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);

    processDefinition.addFlow(startTask, decision);
    processDefinition.addFlow(decision, serviceTask1, function(variables) {
      return variables.score < 10;
    });
    processDefinition.addFlow(decision, serviceTask2, function(variables) {
      return variables.score >= 10;
    });
    processDefinition.addFlow(serviceTask1, decisionMerge);
    processDefinition.addFlow(serviceTask2, decisionMerge);
    processDefinition.addFlow(decisionMerge, endTask);

    return processDefinition;
  }

  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(createProcessDefinition());
  });

  it('should pass', function(done) {
    var events = [];
    processInstance.on('before', function (task) {
      if (task.type === 'start-task')
        events.push(task.type);
      else if (task.type === 'service-task')
        events.push(task);
    });
    processInstance.on('end', function () {
      expect(events[0]).toEqual('start-task');
      expect(events[1].type).toEqual('service-task');
      expect(events[1].id).toEqual(3);
      done();
    });

    processInstance.start({score: 50});
  });
});


/**
 *                ---- service task 1 ----
 *               -                        -
 * start - decision                         decision - end
 *               -                        -         -
 *                ---- service task 2 ----  --------
 *                ----- parallel task ----
 */
describe('exclusive gateway + parrallel gateway process', function() {
  function createProcessDefinition() {
    var processDefinition = new ProcessDefinition();
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);

    var parallelTask = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, Parallel Task is called');
      complete();
    });
    parallelTask.name = 'parallelTask';
    processDefinition.addTask(parallelTask);

    var decision = processBuilder.decision();
    processDefinition.addTask(decision);

    var serviceTask1 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task1', variables);
      complete();
    });
    serviceTask1.name = 'serviceTask1';
    processDefinition.addTask(serviceTask1);

    var serviceTask2 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task2', variables);
      complete();
    });
    serviceTask2.name = 'serviceTask2';
    processDefinition.addTask(serviceTask2);

    var decisionMerge = processBuilder.decision();
    processDefinition.addTask(decisionMerge);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);

    processDefinition.addFlow(startTask, parallelTask);
    processDefinition.addFlow(parallelTask, endTask);
    processDefinition.addFlow(startTask, decision);
    processDefinition.addFlow(decision, serviceTask1, function(variables) {
      return variables.score < 10;
    });
    processDefinition.addFlow(decision, serviceTask2, function(variables) {
      return variables.score >= 10;
    });
    processDefinition.addFlow(serviceTask1, decisionMerge);
    processDefinition.addFlow(serviceTask2, decisionMerge);
    processDefinition.addFlow(decisionMerge, endTask);

    return processDefinition;
  }

  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(createProcessDefinition());
  });

  it('should pass', function(done) {
    var events = [];
    processInstance.on('before', function (task) {
      if (task.type === 'start-task')
        events.push(task.type);
      else if (task.type === 'service-task')
        events.push(task.name);
    });
    processInstance.on('end', function () {
      expect(events[0]).toEqual('start-task');
      expect(events).toContain('parallelTask');
      expect(events).toContain('serviceTask2');
      done();
    });

    processInstance.start({score: 50});
  });
});


/**
 * start -> human task -> end
 */
describe('simple human process', function() {
  function createProcessDefinition() {
    var processDefinition = new ProcessDefinition();
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);
    var humanTask = processBuilder.humanTask();
    humanTask.name = 'humanTask';
    processDefinition.addTask(humanTask);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);
    processDefinition.addFlow(startTask, humanTask);
    processDefinition.addFlow(humanTask, endTask);

    return processDefinition;
  }

  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(createProcessDefinition());
  });

  it('should pass', function(done) {
    var events = [];
    processInstance.on('before', function (task) {
      if (task.type === 'start-task')
        events.push(task.type);
      else if (task.type === 'human-task')
        events.push(task.type);
    });
    processInstance.on('end', function () {
      expect(events[0]).toEqual('start-task');
      expect(events[1]).toEqual('human-task');
      done();
    });

    processInstance.start();
    // Simulate Human Task Complete
    setTimeout(function () {
      processEngine.completeTask(processInstance.id, processInstance.getNode('humanTask').task.id);
    }, 500);
  });
});

