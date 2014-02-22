var _ = require('lodash');
var humanTaskService = require('process-engine').humanTaskService;
var ProcessDefinition = require('process-engine').ProcessDefinition;
var processEngine = require('process-engine').processEngine;

exports.addRoutes = function (app) {
  // JSON API
  app.get('/api/name', function (req, res) {
    res.json({
      name: 'Oliver Zhou'
    });
  });

  app.get('/diagram-viewer/service/process-definition/:id/diagram-layout', function (req, res) {
    console.log(req.params.id);
    res.sendfile('sample-test-diagram.json');
  });

  app.namespace('/api/worklist', function() {
    app.get('/', function (req, res) {
      var query = {};
      if (req.query.status)
        query.status = req.query.status;
      humanTaskService.query(query).done(function (tasks) {
        res.json(tasks);
      });
    });

    app.post('/claim', function (req, res) {
      humanTaskService.claim(req.body.id, 'Oliver Zhou').done(function () {
        res.status(200).send();
      });
    });

    app.post('/complete', function (req, res) {
      humanTaskService.complete(req.body.id, req.body.variables).done(function () {
        res.status(200).send();
      });
    });

    app.post('/startWorking', function (req, res) {
      humanTaskService.startWorking(req.body.id).done(function () {
        res.status(200).send();
      });
    });
  });

  app.get('/api/process-definitions', function (req, res) {
    ProcessDefinition.query({}).done(function (defs) {
      res.json(defs);
    });
  });

  app.post('/api/process-definitions', function (req, res) {
    var def = ProcessDefinition.deserialize(req.body);
    def.save().done(function () {
      res.status(200).send();
    });
  });

  app.post('/api/process-definitions/:id/start', function (req, res) {
    ProcessDefinition.load(req.params.id).done(function (def) {
      var instance = processEngine.createProcessInstance(def);
      instance.start(req.body);
      res.json({id: instance.id});
      console.log(instance.id, 'is started');
    });
  });

  app.namespace('/api/process-instances', function () {
    app.get('/', function (req, res) {
      processEngine.queryProcessInstances({}).done(function (instances) {
        instances.sort(function (a, b) {
          return b.id - a.id;
        });

        res.json(_.map(instances, function (instance) {
          return _.pick(instance, ['id', 'def', 'status', 'variables']);
        }));
      });
    });

    app.get('/:id', function (req, res) {
      processEngine.loadProcessInstance(req.params.id).done(function (instance) {
        instance = _.pick(instance, ['id', 'def', 'status', 'variables']);
        instance.def = {
          '_id': instance.def._id,
          name: instance.def.name
        };

        res.json(instance);
      });
    });
  });

};