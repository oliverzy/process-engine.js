var Promise = require("bluebird");
Promise.longStackTraces();
var expect = require('chai').expect;
var ProcessEngine = require('../');
var processEngine = ProcessEngine.create(),
    ProcessDefinition = ProcessEngine.ProcessDefinition,
    processBuilder = processEngine.processBuilder,
    INSTANCE_STATUS = ProcessEngine.InstanceStatus,
    humanTaskService = processEngine.humanTaskService;
var _ = require('lodash');

/**
 * start -> service task -> end
 */
describe('simple process', function() {
  function createProcessDefinition() {
    var processDefinition = processEngine.createProcessDefinition('simple process');
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
      expect(events[0]).to.equal('start-task');
      expect(events[1]).to.equal('service-task');
      processEngine.loadProcessInstance(processInstance.id).done(function (instance) {
        expect(instance.status).to.be.equal(INSTANCE_STATUS.COMPLETED);
      });

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
    var processDefinition = processEngine.createProcessDefinition('simple parallel process');
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
      expect(events[0]).to.equal('start-task');
      expect(events[1]).to.equal('service-task');
      expect(events[2]).to.equal('service-task');
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
    var processDefinition = processEngine.createProcessDefinition('simple exclusive gateway process');
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);

    var decision = processBuilder.decision();
    processDefinition.addTask(decision);

    var serviceTask1 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task10', variables);
      complete();
    });
    processDefinition.addTask(serviceTask1);

    var serviceTask2 = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task20', variables);
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
      expect(events[0]).to.equal('start-task');
      expect(events[1].type).to.equal('service-task');
      expect(events[1].id).to.equal(3);
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
    var processDefinition = processEngine.createProcessDefinition('exclusive gateway + parrallel gateway process');
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
      expect(events[0]).to.equal('start-task');
      expect(events).to.contain('parallelTask');
      expect(events).to.contain('serviceTask2');
      done();
    });

    processInstance.start({score: 50});
  });
});


/**
 * start -> service task -> human task -> end
 */
describe('simple human process', function() {
  function createProcessDefinition() {
    var processDefinition = processEngine.createProcessDefinition('simple human process');
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);
    var humanTask = processBuilder.humanTask();
    humanTask.name = 'humanTask';
    humanTask.assignee = 'Oliver Zhou';
    processDefinition.addTask(humanTask);
    var serviceTask = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task before human task');
      complete();
    });
    processDefinition.addTask(serviceTask);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);
    processDefinition.addFlow(startTask, serviceTask);
    processDefinition.addFlow(serviceTask, humanTask);
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
      expect(events[0]).to.equal('start-task');
      expect(events[1]).to.equal('human-task');
      done();
    });

    processInstance.start();
    // Simulate Human Task Complete
    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('humanTask').taskEntityId);
      //processEngine.completeTask(processInstance.id, processInstance.getNode('humanTask').task.id);
    }, 200);
  });
});


/**
 * start -> service task -> human task -> end
 */
describe('simple human process persistence', function() {
  function createProcessDefinition() {
    var processDefinition = processEngine.createProcessDefinition('simple human process persistence');
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);
    var humanTask = processBuilder.humanTask();
    humanTask.name = 'humanTask';
    humanTask.assignee = 'Oliver Zhou';
    processDefinition.addTask(humanTask);
    var serviceTask = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task');
      complete();
    });
    processDefinition.addTask(serviceTask);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);
    processDefinition.addFlow(startTask, serviceTask);
    processDefinition.addFlow(serviceTask, humanTask);
    processDefinition.addFlow(humanTask, endTask);

    return processDefinition;
  }

  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(createProcessDefinition());
  });

  it('should pass', function(done) {
    var processInstanceId = processInstance.id;
    var events = [];
    processInstance.on('before', function (task) {
      if (task.type === 'start-task')
        events.push(task.type);
      else if (task.type === 'human-task')
        events.push(task.type);
    });

    processInstance.start();
    // Simulate Human Task Complete
    setTimeout(function () {
      processEngine.clearPool();
      expect(processEngine.processPool[processInstanceId]).to.not.exist;
      processEngine.loadProcessInstance(processInstanceId).done(function (instance) {
        //console.log(util.inspect(instance, {depth: 5}));
        instance.on('end', function () {
          console.log('Loaded process instance is ended!');
          expect(events[0]).to.equal('start-task');
          expect(events[1]).to.equal('human-task');
          done();
        });
        humanTaskService.complete(processInstance.getNode('humanTask').taskEntityId);
        //processEngine.completeTask(processInstanceId, humanTaskId);
      });
    }, 200);
  });
});


/**
 * start -> service task -> decision-repeat -> human task -> decision -> end
 *                                    |                        |
 *                                    |________________________|                                            
 */
describe('human process with cycle', function() {
  function createProcessDefinition() {
    var processDefinition = processEngine.createProcessDefinition('human process with cycle');
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);
    var serviceTask = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task before human task');
      complete();
    });
    processDefinition.addTask(serviceTask);
    var humanTask = processBuilder.humanTask();
    humanTask.name = 'humanTask';
    humanTask.assignee = 'Oliver Zhou';
    processDefinition.addTask(humanTask);

    var decisionRepeat = processBuilder.decision();
    processDefinition.addTask(decisionRepeat);

    var decision = processBuilder.decision();
    processDefinition.addTask(decision);

    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);
    processDefinition.addFlow(startTask, serviceTask);
    processDefinition.addFlow(serviceTask, decisionRepeat);
    processDefinition.addFlow(decisionRepeat, humanTask);
    processDefinition.addFlow(humanTask, decision);

    processDefinition.addFlow(decision, endTask, function(variables) {
      return variables.score < 10;
    });
    processDefinition.addFlow(decision, decisionRepeat, function(variables) {
      return variables.score >= 10;
    });

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
      expect(events[0]).to.equal('start-task');
      expect(events[1]).to.equal('human-task');
      expect(events[2]).to.equal('human-task');
      done();
    });

    processInstance.start();
    // Simulate Human Task Complete
    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('humanTask').taskEntityId, {score: 20});
    }, 200);
    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('humanTask').taskEntityId, {score: 0});
    }, 300);
  });
});

describe('process definition query', function() {
  it('total', function (done) {
    processEngine.queryProcessDefinition({}).done(function (defs) {
      expect(defs.length).to.be.equal(7);
      done();
    });
  });

  it('limit', function (done) {
    processEngine.queryProcessDefinition({}, {limit: 5}).done(function (defs) {
      expect(defs.length).to.be.equal(5);
      done();
    });
  });

});

