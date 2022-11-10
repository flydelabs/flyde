module.exports = {"id":"AccumulateUntilTime","inputs":{"time":{"mode":"required","type":"any"},"item":{"mode":"optional","type":"any"}},"outputs":{"r":{"type":"any"}},"completionOutputs":["r"],"reactiveInputs":["item"],"fn":function (inputs, outputs, adv) { const {item, time} = inputs;
const {r} = outputs;
const {state} = adv;


let list = state.get("list") || [];
if (typeof item !== 'undefined') {
  list.push(item);
  state.set("list", list);

  const timer = state.get("timer");
  
  if (timer) {
    clearTimeout(timer);
  } 
  
  const newTimer = setTimeout(() => {
      r.next(state.get("list") || []);
  }, time);
  
  state.set("timer", newTimer)
}


 }}