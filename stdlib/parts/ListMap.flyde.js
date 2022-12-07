const { dynamicOutput, dynamicPartInput} = require('@flyde/core');

module.exports = {"id":"ListMap","inputs":{"list":{"mode":"required","type":"any"},"fn":{"mode":"required","type":"part({\"item?\": \"any\", \"idx?\": \"any\"}|{\"r\": \"any\", \"rs\": \"any\"})"}},"outputs":{"r":{"type":"any"},"rs":{"type":"any"}},"fn":function (inputs, outputs, adv) { let newList = [];

const { list, fn} = inputs;
const o = outputs;

let received = new Set();

const cleanUps = [];

list.forEach((item, idx) => {
  const itemInput = dynamicPartInput();
  const idxInput = dynamicPartInput();
  const mainOutput = dynamicOutput();
  const sideOutput = dynamicOutput();
  mainOutput.subscribe((receivedItem) => {
    newList[idx] = receivedItem;
    received.add(idx);
    if (received.size === list.length) {
      o.r.next(newList);
    }
  });

  sideOutput.subscribe((v) => {
    o.rs.next(v);
  });

  const clean = adv.execute(
    fn,
    { item: itemInput, idx: idxInput },
    { r: mainOutput, rs: sideOutput },
    `${adv.insId}-fn`
  );

  cleanUps.push(clean);

  itemInput.subject.next(item);
  idxInput.subject.next(idx);
});

if (list.length === 0) {
  o.r.next(list);
}

adv.onCleanup(() => {
  cleanUps.forEach((fn) => fn());
});
 }}