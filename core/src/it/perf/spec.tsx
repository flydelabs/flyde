// import { assert } from 'chai';

// const jg = require('jsdom-global');

// import { Subject } from 'rxjs';
// import {reactUniDriver} from @unidriver/react;
// import ReactDOM from 'react-dom';
// import React from 'react';
// import { Counter } from '../fixtures';
// import { execute } from '../..';

// let cleanups: any[] = [];

// beforeEach(() => {
// 	cleanups.push(jg());
// 	document.body.innerHTML = '';
// });

// afterEach(() => {
// 	cleanups.forEach(fn => fn());
// 	cleanups = [];
// });

// export class CounterNative extends React.PureComponent<any> {
// 	render() {
// 		const {val, inc, dec} = this.props;
// 		return <div><button onClick={inc}>+</button><span className='txt'>{val}</span><button>{dec}</button></div>;
// 	}
// }

// const pipeToDomAndReturnDriver = (sub: Subject<any>) => {
// 	const div = document.createElement('div');
// 	document.body.appendChild(div);
// 	sub.subscribe((val) => {
// 		ReactDOM.render(val, div);
// 	});
// 	return reactUniDriver(div);
// }

// describe('performance', () => {

// 	it('is not more than 75% slower than native react', async () => {

// 		const ns = Date.now();

// 		const count = 100;

// 		await Promise.all(new Array(count).fill(0)
// 			.map(async (_, i) => {
// 				const div = document.createElement('div');
// 				document.body.appendChild(div);
// 				const native = <CounterNative val={i}/>;
// 				ReactDOM.render(native, div);
// 				const d = reactUniDriver(div);
// 				assert.equal(await d.$('.txt').text(), i.toString());

// 				document.body.innerHTML = '';
// 			}));

// 		const nativeTotal = Date.now() - ns;

// 		const fs = Date.now();
// 		await Promise.all(new Array(count).fill(0)
// 			.map(async (_, i) => {
// 				const value = new Subject();
// 				const jsx = new Subject<any>();

// 				const inc = new Subject(), dec = new Subject();
// 				execute({part: Counter, {value}, inputs: {jsx, outputs: inc, partsRepo: dec}});

// 				const d = pipeToDomAndReturnDriver(jsx);
// 				value.next(i);
// 				assert.equal(await d.$('.txt').text(), i.toString());

// 				document.body.innerHTML = '';
// 			}));

// 		const fatTotal = Date.now() - fs;

// 		assert.isBelow(fatTotal, nativeTotal * 1.75);
// 	});

// });
