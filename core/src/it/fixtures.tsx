// import { VisualNode, nodeInput, nodeOutput } from "../part";

// import { connectionData } from "..";
// import { Button, Txt, container, listFrom, merge, add, transform } from "../lib";
// import { legacyStaticInputPinConfig, dynamicInputPinConfig, nodeInstance } from "../execute";
// import { connectionNode, externalConnectionNode } from "../connect";
// // import { connectionNode } from "../connect";

// export const Counter: VisualNode = {
// 	id: 'Counter',
// 	inputs: {
// 		val: nodeInput('number')
// 	},
// 	outputs: {
// 		jsx: nodeOutput('jsx'),
// 		inc: nodeOutput('none', true),
// 		dec: nodeOutput('none', true),
// 	},
// 	instances: [
// 		nodeInstance('lf', listFrom),
// 		nodeInstance('txt', Txt),
// 		nodeInstance('c', container),
// 		nodeInstance('bdec', Button, {label: legacyStaticInputPinConfig('+')}),
// 		nodeInstance('binc', Button, {label: legacyStaticInputPinConfig('-')})
// 	],
// 	connections: [
// 		connectionData(['binc', 'jsx'], ['lf', 'item1']),
// 		connectionData(['txt', 'jsx'], ['lf', 'item2']),
// 		connectionData(['bdec', 'jsx'], ['lf', 'item3']),
// 		connectionData(['lf', 'list'], ['c', 'children']),
// 		{
// 			from: externalConnectionNode('val'),
// 			to: connectionNode('txt', 'value')
// 		},
// 		{
// 			from: connectionNode('c', 'jsx'),
// 			to: externalConnectionNode('jsx')
// 		},
// 		{
// 			from: connectionNode('binc', 'onClick'),
// 			to: externalConnectionNode('inc')
// 		},
// 		{
// 			from: connectionNode('bdec', 'onClick'),
// 			to: externalConnectionNode('dec')
// 		}
// 	]
// };

// export const ControlledCounter: VisualNode = {
// 	id: 'ControllerCounter',
// 	inputs: {},
// 	outputs: {
// 		jsx: nodeOutput('jsx')
// 	},
// 	instances: [
// 		{
// 			id: 'a',
// 			part: add,
// 			inputConfig: {
// 				n1: dynamicInputPinConfig(true),
// 				n2: dynamicInputPinConfig(true)
// 			},
// 			pos: {x: 0, y: 0}
// 		},
// 		{
// 			id: 'cnt',
// 			part: Counter,
// 			pos: {x: 0, y: 0},
// 			inputConfig: {}
// 		},
// 		{
// 			id: 'm',
// 			pos: {x: 0, y: 0},
// 			part: merge,
// 			inputConfig: {
// 				a: legacyStaticInputPinConfig(0)
// 			}
// 		},
// 		{
// 			id: 't1',
// 			pos: {x: 0, y: 0},
// 			part: transform,
// 			inputConfig: {
// 				to: legacyStaticInputPinConfig(1)
// 			}
// 		},
// 		{
// 			id: 't2',
// 			pos: {x: 0, y: 0},
// 			part: transform,
// 			inputConfig: {
// 				to: legacyStaticInputPinConfig(-1)
// 			}
// 		}
// 	],
// 	connections: [
// 		connectionData(['a', 'r'], ['m', 'b']),
// 		connectionData(['m', 'r'], ['cnt', 'val']),
// 		connectionData(['m', 'r'], ['a', 'n1'], true),
// 		connectionData(['cnt', 'inc'], ['t1', 'from']),
// 		connectionData(['cnt', 'dec'], ['t2', 'from']),
// 		connectionData(['t1', 'r'], ['a', 'n2']),
// 		connectionData(['t2', 'r'], ['a', 'n2']),
// 		{
// 			from: connectionNode('cnt', 'jsx'),
// 			to: externalConnectionNode('jsx')
// 		}
// 	]
// };

// // export const CounterListViewRaw = {
// // 	name: 'CounterListViewRaw',
// // 	instances: [
// // 		{
// // 			id: 'm',
// // 			part: listMap,
// // 			staticInputs: {
// // 				fn: rename(Counter, {value: 'item', jsx: 'r'})
// // 			}
// // 		},
// // 		{
// // 			id: 'c',
// // 			part: container
// // 		}
// // 	],
// // 	connections: [
// // 		{from: 'm.r', to: 'c.children'}
// // 		],
// // 	renames: {
// // 		'm.rs': 'rs',
// // 		'm.list': 'list',
// // 		'c.jsx': 'jsx',
// // 	}
// // }

// // export const CounterListView: ConnectedNode = {
// // 	id: 'CounterListView',
// // 	instances: [
// // 		{
// // 			id: 'm',
// // 			part: listMap,
// // 			staticInputs: {
// // 				fn: rename(Counter, {value: 'item', jsx: 'r'})
// // 			}
// // 		},
// // 		{
// // 			id: 'c',
// // 			part: container
// // 		},
// // 		{
// // 			id: 'cond-inc',
// // 			part: pikhv,
// // 			staticInputs: {key: 'key', value: 'inc'}
// // 		},
// // 		{
// // 			id: 'cond-dec',
// // 			part: pikhv,
// // 			staticInputs: {key: 'key', value: 'dec'}
// // 		},
// // 		{
// // 			id: 'pick-idx-inc',
// // 			part: pick,
// // 			staticInputs: {key: 'idx'}
// // 		},
// // 		{
// // 			id: 'pick-idx-dec',
// // 			part: pick,
// // 			staticInputs: {key: 'idx'}
// // 		}
// // 	],
// // 	connections: [
// // 		{from: 'm.rs', to: 'cond-inc.obj'},
// // 		{from: 'm.rs', to: 'cond-dec.obj'},
// // 		{from: 'cond-inc.r', to: 'pick-idx-inc.obj'},
// // 		{from: 'cond-dec.r', to: 'pick-idx-dec.obj'},
// // 		{from: 'm.r', to: 'c.children'}
// // 	],
// // renames: {
// // 	'c.jsx': 'jsx',
// // 	'm.list': 'list',
// // 	'pick-idx-inc.r': 'inc',
// // 	'pick-idx-dec.r': 'dec'
// // }
// // };

// // export const CounterList = {
// // 	name: 'CounterList',
// // 	instances: [
// // 		{
// // 			id: 'mr',
// // 			part: merge,
// // 			staticInputs: {
// // 				a: [0, 0]
// // 			}
// // 		},
// // 		{
// // 			id: 'clist',
// // 			part: connect(CounterListView)
// // 		},
// // 		{
// // 			id: 'a1',
// // 			part: add,
// // 			staticInputs: {n2: 1}
// // 		},
// // 		{
// // 			id: 's1',
// // 			part: {...setItem, clean: true}
// // 		},
// // 		{
// // 			id: 'a2',
// // 			part: add,
// // 			staticInputs: {n2: -1}
// // 		},
// // 		{
// // 			id: 's2',
// // 			part: {...setItem, clean: true}
// // 		},
// // 		{
// // 			id: 'g1',
// // 			part: getItem
// // 		}
// // 	],
// // 	connections: [
// // 		{from: 'mr.r', to: 'clist.list'},
// // 		{from: 'mr.r', to: 'g1.list'},
// // 		{from: 'mr.r', to: 's1.list'},
// // 		{from: 'mr.r', to: 's2.list'},
// // 		{from: 'clist.inc', to: 'g1.idx'},
// // 		{from: 'clist.inc', to: 's1.idx'},
// // 		{from: 'clist.dec', to: 'g1.idx'},
// // 		{from: 'clist.dec', to: 's2.idx'},
// // 		{from: 'g1.r', to: 'a1.n1'},
// // 		{from: 'g1.r', to: 'a2.n1'},
// // 		{from: 'a1.r', to: 's1.item'},
// // 		{from: 'a2.r', to: 's2.item'},
// // 		{from: 's1.r', to: 'mr.b', delayed: true},
// // 		{from: 's2.r', to: 'mr.b', delayed: true}
// // 	],
// // 	renames: {
// // 		'clist.jsx': 'jsx',
// // 		'clist.dec': 'dec'
// // 	}
// // };
