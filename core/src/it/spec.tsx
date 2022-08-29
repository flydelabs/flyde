// import { assert } from 'chai';

// import { spy } from "sinon";

// const jg = require('jsdom-global');
// import { Subject } from 'rxjs';
// import {reactUniDriver} from @unidriver/react;
// import * as ReactDOM from 'react-dom';
// // import { Counter, ControlledCounter } from './fixtures';
// import { execute, dynamicPartInput } from '../execute';

// let cleanups: any[] = [];

// beforeEach(() => {
// 	cleanups.push(jg());
// 	document.body.innerHTML = '';
// });

// afterEach(() => {
// 	cleanups.forEach(fn => fn());
// 	cleanups = [];
// });

// const pipeToDomAndReturnDriver = (sub: Subject<any>) => {
// 	const div = document.createElement('div');
// 	document.body.appendChild(div);
// 	sub.subscribe((val) => {
// 		ReactDOM.render(val, div);
// 	});
// 	return reactUniDriver(div);
// }

// describe('counter app', () => {

// 	it('shows right value and triggers right outputs', async () => {
// 		const val = dynamicPartInput();
// 		const jsx = new Subject<any>();

// 		const inc = new Subject(), dec = new Subject();
// 		execute(Counter, {val}, {jsx, inc, dec});

// 		const s1 = spy();
// 		const s2 = spy();
// 		inc.subscribe(() => s1());
// 		dec.subscribe(() => s2());

// 		const driver = pipeToDomAndReturnDriver(jsx);

// 		val.subject.next(7);

// 		assert.equal(s1.callCount, 0);

// 		assert.equal(await driver.$('.txt').text(), '7');

// 		await driver.$$('.button').get(0).click();
// 		await driver.$$('.button').get(1).click();
// 		await driver.$$('.button').get(0).click();
// 		assert.equal(s1.callCount, 2);
// 		assert.equal(s2.callCount, 1);

// 		await driver.$$('.button').get(1).click();
// 		await driver.$$('.button').get(1).click();
// 		assert.equal(s2.callCount, 3);

// 		assert.equal(await driver.$('.txt').text(), '7');

// 		val.subject.next(827);
// 		assert.equal(await driver.$('.txt').text(), '827');
// 		assert.equal(s1.callCount, 2);
// 		assert.equal(s2.callCount, 3);
// 	});
// });

// 	it.skip('works with state', async () => {
// 		const jsx = new Subject<any>();
// 		const driver = pipeToDomAndReturnDriver(jsx);
// 		execute(ControlledCounter, {}, {jsx});

// 		assert.equal(await driver.$('.txt').text(), '0');

// 		await driver.$$('.button').get(0).click();

// 		assert.equal(await driver.$('.txt').text(), '1');

// 		await driver.$$('.button').get(0).click();
// 		await driver.$$('.button').get(0).click();

// 		assert.equal(await driver.$('.txt').text(), '3');

// 		await driver.$$('.button').get(1).click();
// 		await driver.$$('.button').get(1).click();
// 		await driver.$$('.button').get(1).click();
// 		await driver.$$('.button').get(1).click();
// 		await driver.$$('.button').get(1).click();
// 		assert.equal(await driver.$('.txt').text(), '-2');
// 	});

// // 	describe('multi counter', () => {
// // 		it('works - view mode - un refactored', async () => {
// // 			const jsx = new Subject()
// // 				, list = new Subject()
// // 				, rs = new Subject();

// // 			const s = spy();
// // 			rs.subscribe(s);

// // 			const d = pipeToDomAndReturnDriver(jsx);
// // 			execute(connect(CounterListViewRaw), {list}, {jsx, rs});

// // 			list.next([0, 2, 5]);

// // 			assert.deepEqual(await d.$$('.txt').text(), ['0', '2', '5']);

// // 			assert.deepEqual(s.callCount, 0);

// // 			await d.$$('button').get(0).click(); // this is the first + button

// // 			assert.deepEqual(s.callCount, 1);
// // 			assert.deepEqual(s.lastCall.args[0].key, 'inc');;
// // 			assert.deepEqual(s.lastCall.args[0].idx, 0);;

// // 			await d.$$('button').get(2).click(); // this is the second + button
// // 			await d.$$('button').get(2).click();

// // 			assert.deepEqual(s.callCount, 3);
// // 			assert.deepEqual(s.lastCall.args[0].key, 'inc');
// // 			assert.deepEqual(s.lastCall.args[0].idx, 1);

// // 			await d.$$('button').get(5).click(); // this is the third - button
// // 			await d.$$('button').get(5).click(); // this is the third - button

// // 			assert.deepEqual(s.callCount, 5);
// // 			assert.deepEqual(s.lastCall.args[0].key, 'dec');
// // 			assert.deepEqual(s.lastCall.args[0].idx, 2);
// // 		});

// // 		it('works - view mode', async () => {
// // 			const jsx = new Subject()
// // 				, list = new Subject()
// // 				, inc = new Subject()
// // 				, dec = new Subject();

// // 			const sinc = spy();
// // 			const sdec = spy();
// // 			inc.subscribe(sinc);
// // 			dec.subscribe(sdec);

// // 			const d = pipeToDomAndReturnDriver(jsx);

// // 			execute(rename(connect(CounterListView), {}), {list}, {jsx, inc, dec});

// // 			list.next([0, 2, 5]);

// // 			assert.deepEqual(await d.$$('.txt').text(), ['0', '2', '5']);

// // 			await d.$$('button').get(1).click(); // this is the - button on the second counter
// // 			await d.$$('button').get(5).click(); // this is the + button on the second counter

// // 			assert.deepEqual(sinc.callCount, 0);
// // 			assert.deepEqual(sdec.callCount, 2);
// // 			assert.deepEqual(sdec.lastCall.args[0], 2);
// // 			// const html = (await d.getNative()).innerHTML;

// // 			await d.$$('button').get(0).click(); // this is the - button on the second counter

// // 			assert.deepEqual(sdec.callCount, 2);
// // 			assert.deepEqual(sinc.callCount, 1);
// // 			assert.deepEqual(sdec.lastCall.args[0], 2)
// // 			assert.deepEqual(sinc.lastCall.args[0], 0)
// // 		});

// // 		it('works - with state', async () => {

// // 			const jsx = new Subject();

// // 			const d = pipeToDomAndReturnDriver(jsx);
// // 			execute(connect(CounterList), {}, {jsx});

// // 			assert.deepEqual(await d.$$('.txt').text(), ['0', '0']);

// // 			assert.equal(await d.$$('button').count(), 4);

// // 			await d.$$('button').get(0).click(); // this is the + button on the second counter
// // 			await d.$$('button').get(0).click();
// // 			await d.$$('button').get(3).click();
// // 			await d.$$('button').get(3).click();
// // 			await d.$$('button').get(3).click();

// // 			assert.deepEqual(await d.$$('.txt').text(), ['2', '-3']);

// // 		});

// // 	});
// // });
