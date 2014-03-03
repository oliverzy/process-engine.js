/**
 * start -> service task -> end
 */
var simpleDefinition = {
  name: 'simple process',
  tasks: {
    start: {type: 'start'},
    'service1': {type: 'service', action: function (variables, complete) {
        console.log('lalala');
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

/**
 *       ---- service task 1 ----
 *      -                        -
 * start                          end
 *      -                        -
 *       ---- service task 2 ----
 */
var parallelDefinition = {
  name: 'simple parallel process',
  tasks: {
    start: {type: 'start'},
    service1: {type: 'service', action: function (variables, complete) {
      console.log('Oh, service task1');
      complete();
    }},
    service2: {type: 'service', action: function (variables, complete) {
      console.log('Oh, service task2');
      complete();
    }},
    end: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'service1'},
    {from: 'start', to: 'service2'},
    {from: 'service1', to: 'end'},
    {from: 'service2', to: 'end'}
  ]
};

/**
 *                ---- service task 1 ----
 *               -                        -
 * start - decision                         decision - end
 *               -                        -
 *                ---- service task 2 ----
 */
var exclusiveDefinition = {
  name: 'simple exclusive gateway process',
  tasks: {
    start: {type: 'start'},
    decision: {type: 'decision'},
    service1: {type: 'service', action: function (variables, complete) {
      console.log('Oh, service task10');
      complete();
    }},
    service2: {type: 'service', action: function (variables, complete) {
      console.log('Oh, service task20');
      complete();
    }},
    decisionMerge: {type: 'decision'},
    end: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'decision'},
    {from: 'decision', to: 'service1', condition: function(variables) {
      return variables.score < 10;
    }},
    {from: 'decision', to: 'service2', condition: function(variables) {
      return variables.score >= 10;
    }},
    {from: 'service1', to: 'decisionMerge'},
    {from: 'service2', to: 'decisionMerge'},
    {from: 'decisionMerge', to: 'end'}
  ],

  variables: {
    score: 50
  }
};

/**
 *                ---- service task 1 ----
 *               -                        -
 * start - decision                         decision - end
 *               -                        -         -
 *                ---- service task 2 ----  --------
 *                ----- parallel task ----
 */
var parallelExclusiveDefinition = {
  name: 'exclusive gateway + parrallel gateway process',
  tasks: {
    start: {type: 'start'},
    parallel: {type: 'service', action: function (variables, complete) {
      console.log('Oh, Parallel Task is called');
      complete();
    }},
    decision: {type: 'decision'},
    service1: {type: 'service', action: function (variables, complete) {
      console.log('Oh, service task1');
      complete();
    }},
    service2: {type: 'service', action: function (variables, complete) {
      console.log('Oh, service task2');
      complete();
    }},
    decisionMerge: {type: 'decision'},
    end: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'parallel'},
    {from: 'parallel', to: 'end'},
    {from: 'start', to: 'decision'},
    {from: 'decision', to: 'service1', condition: function(variables) {
      return variables.score < 10;
    }},
    {from: 'decision', to: 'service2', condition: function(variables) {
      return variables.score >= 10;
    }},
    {from: 'service1', to: 'decisionMerge'},
    {from: 'service2', to: 'decisionMerge'},
    {from: 'decisionMerge', to: 'end'}
  ],

  variables: {
    score: 50
  }
};

/**
 * start -> service task -> human task -> end
 */
var simpleHumanDefinition = {
  name: 'simple human process',
  tasks: {
    start: {type: 'start'},
    service: {type: 'service', action: function (variables, complete) {
        console.log('lalala');
        complete();
      }
    },
    humanTask: {type: 'human', assignee: 'Oliver Zhou'},
    end: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'service'},
    {from: 'service', to: 'humanTask'},
    {from: 'humanTask', to: 'end'}
  ]
};

/**
 * start -> service task -> decision-repeat -> human task -> decision -> end
 *                                    |                        |
 *                                    |________________________|                                            
 */
var cycleDefinition = {
  name: 'human process with cycle',
  tasks: {
    start: {type: 'start'},
    service: {type: 'service', action: function (variables, complete) {
        console.log('lalala');
        complete();
      }
    },
    decisionRepeat: {type: 'decision'},
    humanTask: {type: 'human', assignee: 'Oliver Zhou'},
    decision: {type: 'decision'},
    end: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'service'},
    {from: 'service', to: 'decisionRepeat'},
    {from: 'decisionRepeat', to: 'humanTask'},
    {from: 'humanTask', to: 'decision'},
    {from: 'decision', to: 'end', condition: function (variables) {
      return variables.score < 10;
    }},
    {from: 'decision', to: 'decisionRepeat', condition: function (variables) {
      return variables.score >= 10;
    }}
  ]
};

var errorDefinition = {
  name: 'simple process with error',
  tasks: {
    start: {type: 'start'},
    'service1': {type: 'service', action: function (variables, complete) {
        console.log('Oh, service task with error');
        complete({error: 'this is an error message'});
      }
    },
    end: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'service1'},
    {from: 'service1', to: 'end'}
  ]
};

module.exports = {
  simple: simpleDefinition,
  parallel: parallelDefinition,
  exclusive: exclusiveDefinition,
  parallelExclusive: parallelExclusiveDefinition,
  simpleHuman: simpleHumanDefinition,
  cycle: cycleDefinition,
  error: errorDefinition
};
