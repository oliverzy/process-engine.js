var ProcessDefinition = require('./process-engine.js').ProcessDefinition;
var ProcessInstance = require('./process-engine.js').ProcessInstance;
var processBuilder = require('./process-engine.js').processBuilder;

/**
 * start -> service task -> end
 */
describe('simple process', function() {
  function createProcessDefinition() {
    var processDefinition = new ProcessDefinition();
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);
    var serviceTask = processBuilder.serviceTask(function (complete) {
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
    var processDefinition = createProcessDefinition();
    processInstance = new ProcessInstance(processDefinition);
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

    var serviceTask1 = processBuilder.serviceTask(function (complete) {
      console.log('Oh, service task1');
      complete();
    });
    processDefinition.addTask(serviceTask1);

    var serviceTask2 = processBuilder.serviceTask(function (complete) {
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
    var processDefinition = createProcessDefinition();
    processInstance = new ProcessInstance(processDefinition);
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

    var serviceTask1 = processBuilder.serviceTask(function (complete) {
      console.log('Oh, service task1');
      complete();
    });
    processDefinition.addTask(serviceTask1);

    var serviceTask2 = processBuilder.serviceTask(function (complete) {
      console.log('Oh, service task2');
      complete();
    });
    processDefinition.addTask(serviceTask2);

    var decisionMerge = processBuilder.decision();
    processDefinition.addTask(decisionMerge);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);

    processDefinition.addFlow(startTask, decision);
    processDefinition.addFlow(decision, serviceTask1, function() {
      return false;
    });
    processDefinition.addFlow(decision, serviceTask2, function() {
      return true;
    });
    processDefinition.addFlow(serviceTask1, decisionMerge);
    processDefinition.addFlow(serviceTask2, decisionMerge);
    processDefinition.addFlow(decisionMerge, endTask);

    return processDefinition;
  }

  var processInstance;
  beforeEach(function() {
    var processDefinition = createProcessDefinition();
    processInstance = new ProcessInstance(processDefinition);
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

    processInstance.start();
  });
});

