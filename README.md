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
// Process Builder is used to create tasks
var processBuilder = processEngine.processBuilder;

function createProcessDefinition() {
    // Create a new process definition object
    var processDefinition = processEngine.createProcessDefinition('simple process');
    // Each process must have a start task as the first task
    var startTask = processBuilder.startTask();
    processDefinition.addTask(startTask);
    
    // A service task is used to execute any business logic
    var serviceTask = processBuilder.serviceTask(function (variables, complete) {
      console.log('Oh, service task');
      complete();
    });
    processDefinition.addTask(serviceTask);
    
    // An end task means the end of process
    var endTask = processBuilder.endTask();
    processDefinition.addTask(endTask);
    
    // Connect all tasks with flow
    processDefinition.addFlow(startTask, serviceTask);
    processDefinition.addFlow(serviceTask, endTask);

    return processDefinition;
}

// Create process instance from the above process definition
var processInstance = processEngine.createProcessInstance(createProcessDefinition());
// Start the execution of the process instance
processInstance.start();
```

__See tests for all usage that process engine supports__

###API
* `ProcessEngine`
  * `createProcessDefinition(name)`: Create a new process definition with `name`
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

###Roadmap
* Planned
  * Human Task Form Builder
  * User Management Service
  * Performance Benchmark
* Future
  * Separate Running and Histronic Process Instances into different collections
  * Sub Process
  * BPMN 2.0 XML Import/Export
