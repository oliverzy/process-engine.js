__Process automation for Node.js__


###Best For
* Task Orchestration
* Human Task Management
* Process Management and Monitoring via a Node.js web application

###Features
* Start/End/Decision/Parallel/Service/Human Task
* Human Task Management
* Process Definition Management and Visualization
* Process Instance Management and Visualization

###Get Started
`npm install process-engine`

```js
var ProcessEngine = require('process-engine');
// Create a process engine object
var processEngine = ProcessEngine.create();
var simpleDefinition = {
  name: 'simple process',
  tasks: {
    start: {type: 'start'},
    'service1': {type: 'service', action: function (variables, complete) {
        console.log('do work');
        complete();
      }
    },
    end: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'service1'},
    {from: 'service1', to: 'end'}
  ]
};

// Create process instance from the above process definition
var processDefinition = processEngine.importProcessDefinition(simpleDefinition);
var processInstance = processEngine.createProcessInstance(processDefinition);
// Start the execution of the process instance
processInstance.start();
```

__See examples/tests for all usage that process engine supports__

###API
* `ProcessEngine`
  * `importProcessDefinition(definition)`: Create a new process definition based on `definition` object
  * `createProcessDefinition(name)`: Create an empty process definition with `name`
  * `loadProcessDefinition(id)`: Load a process definition by `id`
  * `queryProcessDefinition(conditions, options)`: Query process definitions by conditions and options
  * `createProcessInstance(def)`: Create a new process instance with definition `def `
  * `loadProcessInstance(id)`: Load a process instance by `id`
  * `queryProcessInstance(conditions)`: Query process instances by conditions
  * `completeTask(processId, taskId, variables)`: Complete a task with `processId`, `taskId`, `variables`
* `ProcessInstance` is a Node event emitter. 
  * `Events`
    * `before`: emitted before each task is executed
    * `after`: emitted after each task is executed
    * `end`: emitted when the whole process instance is ended
  * `start(variables)`: Start the process instance with given `variables`
  * `getNode(taskName)`: Get the runtime node with `taskName`
* `HumanTaskService`
  * `complete(taskId, variables)`: Complete the human task `taskId` with `variables`
  * `claim(taskId, user)`: Claim the human task `taskId` with User `user`
  * `startWorking(taskId)`: Start to work on the human task `taskId`
  * `query(conditions)`: Query the human tasks by `conditions`

###UI
![image](https://dl.dropboxusercontent.com/u/54970183/Snip20140301_2.png)

process-engine.js contains a Node.js web application to manage the process instances and human task list.
* Go to `ui` folder
* Run `npm install`
* Run `bower install` 
* Run `brunch watch --server` to launch the server
* Open `http://localhost:3000/#/definitions` in your browser

###Development
* Test Runner: `npm install -g mocha`
* Front End Package Manager: `npm install -g bower`
* Front End Build: `npm install -g brunch`
* Code Coverage: `npm install -g istanbul`
* nodemon: `npm install -g nodemon`

###Roadmap
* Planned
  * Human Task Form Builder
  * User Management Service
  * Performance Benchmark
* Future
  * Message/Timer Event Support
  * Separate Running and Histronic Process Instances into different collections
  * Sub Process
  * BPMN 2.0 XML Import/Export
