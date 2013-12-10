var Promise = require("bluebird");
Promise.longStackTraces();
var expect = require('chai').expect;
var humanTaskService = require('../').humanTaskService;
var STATUS = require('../').status;

describe('human task service', function () {
  it('create new human task with assignee', function (done) {
    humanTaskService.newTask({
      assignee: 'Oliver Zhou'
    }).done(function (task) {
      expect(task._id).to.not.equal(null);
      expect(task.assignee).to.equal('Oliver Zhou');
      expect(task.status).to.equal(STATUS.RESERVED);
      done();
    });
  });

  it('create new human task with candidates', function (done) {
    humanTaskService.newTask({
      candidateUsers: ['Oliver Zhou', 'Gary Chang']
    }).done(function (task) {
      expect(task._id).to.not.equal(null);
      expect(task.assignee).to.equal(undefined);
      expect(task.status).to.equal(STATUS.NEW);
      done();
    });
  });

  it('claim human task', function (done) {
    humanTaskService.newTask({
      candidateUsers: ['Oliver Zhou', 'Gary Chang']
    }).then(function (task) {
      humanTaskService.claim(task._id, 'Oliver Zhou').then(function (num) {
        expect(num).to.equal(1);
        return humanTaskService.queryOne({'_id': task._id});
      })
      .done(function (task) {
        expect(task.assignee).to.equal('Oliver Zhou');
        expect(task.status).to.equal(STATUS.IN_PROGRESS);
        done();
      });
    });
  });

  it('complete human task with assignee', function (done) {
    humanTaskService.newTask({
      assignee: 'Oliver Zhou'
    }).then(function (task) {
      return humanTaskService.complete(task._id).then(function () {
        return humanTaskService.queryOne({'_id': task._id});
      });
    }).done(function(task) {
      expect(task.status).to.equal(STATUS.COMPLETED);
      done();
    });
  });
});