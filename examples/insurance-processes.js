var quickQuoteDefinition = {
  name: 'Quick Quote',
  category: 'Insurance',
  tasks: {
    start: {type: 'start'},
    decisionRepeat: {type: 'decision'},
    'Basic Info': {type: 'human', assignee: 'Oliver Zhou'},
    'Auto UW': {type: 'service', action: function (variables, complete) {
      variables.autoUnderwritingResult = variables.age < 60;
      console.log('Auto underwriting service task result:', variables.autoUnderwritingResult);
      complete();
    }},
    decisionAutoUnderwriting: {type: 'decision'},
    'Manual UW': {type: 'human', assignee: 'Gary Chang'},
    decisionManualUnderwriting: {type: 'decision'},
    decisionMerge: {type: 'decision'},
    'View Result': {type: 'human', assignee: 'Oliver Zhou'},
    'Purchase': {type: 'decision'},
    endPurchase: {type: 'end'},
    endNotPurchase: {type: 'end'}
  },

  flows: [
    {from: 'start', to: 'decisionRepeat'},
    {from: 'decisionRepeat', to: 'Basic Info'},
    {from: 'Basic Info', to: 'Auto UW'},
    {from: 'Auto UW', to: 'decisionAutoUnderwriting'},
    {from: 'decisionAutoUnderwriting', to: 'Manual UW', condition: function (variables) {
      //console.log(variables);
      return !variables.autoUnderwritingResult;
    }},
    {from: 'decisionAutoUnderwriting', to: 'decisionMerge', condition: function (variables) {
      //console.log(variables);
      return variables.autoUnderwritingResult;
    }},
    {from: 'Manual UW', to: 'decisionManualUnderwriting'},
    {from: 'decisionManualUnderwriting', to: 'decisionRepeat', condition: function (variables) {
      //console.log(variables);
      return !variables.manualUnderwritingResult;
    }},
    {from: 'decisionManualUnderwriting', to: 'decisionMerge', condition: function (variables) {
      //console.log(variables);
      return variables.manualUnderwritingResult;
    }},
    {from: 'decisionMerge', to: 'View Result'},
    {from: 'View Result', to: 'Purchase'},
    {from: 'Purchase', to: 'endPurchase', condition: function (variables) {
      return variables.confirmPurchase;
    }},
    {from: 'Purchase', to: 'endNotPurchase', condition: function (variables) {
      return !variables.confirmPurchase;
    }}
  ],

  variables: {name: 'Oliver Zhou', age: 70, manualUnderwritingResult: undefined, confirmPurchase: undefined}
};

module.exports = {
  quickQuote: quickQuoteDefinition
};
