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
var samples = require('../examples/basic-processes.js');

describe('simple process', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.simple));
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

describe('simple parallel process', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.parallel));
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

describe('simple exclusive gateway process', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.exclusive));
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

describe('exclusive gateway + parrallel gateway process', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.parallelExclusive));
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
      expect(events).to.contain('parallel');
      expect(events).to.contain('service2');
      done();
    });

    processInstance.start({score: 50});
  });
});

describe('simple human process', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.simpleHuman));
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

describe('simple human process persistence', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.simpleHuman));
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

describe('human process with cycle', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.cycle));
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

describe('simple process with error', function() {
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processEngine.importProcessDefinition(samples.error));
  });

  it('should pass', function(done) {
    processInstance.on('end', function () {
      expect(processInstance.status).to.be.equal(INSTANCE_STATUS.FAILED);
      expect(processInstance.error).to.be.deep.equal({error: 'this is an error message'});

      done();
    });

    processInstance.start();
  });
});

describe('process definition query', function() {
  it('total', function (done) {
    processEngine.queryProcessDefinition({}).done(function (defs) {
      expect(defs.length).to.be.equal(8);
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

