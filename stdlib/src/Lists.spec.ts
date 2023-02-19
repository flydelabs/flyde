import { delay, dynamicPartInput, eventually, execute, inlinePartInstance, randomInt, staticInputPinConfig, staticPartInput, VisualPart } from '@flyde/core';
import {assert, expect} from 'chai'

import { concisePart, spiedOutput } from '@flyde/core/dist/test-utils';
import { Publish, Subscribe } from './ControlFlow.flyde';
import { AccumulateValuesByCount, AccumulateValuesByTime } from './Lists.flyde';

describe('Lists', () => {

    describe('Accumulate values by count', () => {
        it('emits values received until specified count has been reached', async () => {
            const [s, accumulated] = spiedOutput();

            const input = dynamicPartInput();

            execute({part: AccumulateValuesByCount, outputs: {accumulated}, inputs: {value: input, count: staticPartInput(3)}, partsRepo: {}});

            input.subject.next(1);
            input.subject.next(2);
            input.subject.next(3);

            // does not enter the first list
            input.subject.next(4);
            input.subject.next(5);
            input.subject.next(6);

            // does not enter the second list
            input.subject.next(7);

            await eventually(() => {
                console.log(s.getCalls());
                
                assert.equal(s.callCount, 2);
                assert.deepEqual(s.firstCall.args[0], [1,2,3]);
                assert.deepEqual(s.secondCall.args[0], [4,5,6]);
            });
        });
    })

    describe('Accumulate Values by Time', () => {
        it('emits values received until specified time has passed', async () => {
            const timeout = 100;

            const [s, accumulated] = spiedOutput();

            const input = dynamicPartInput();

            execute({part: AccumulateValuesByTime, outputs: {accumulated}, inputs: {value: input, time: staticPartInput(timeout)}, partsRepo: {}, parentInsId: 'bob'});

            // enters the list
            input.subject.next(1);
            await delay(timeout / 3);
            // // enters the list
            input.subject.next(2);
            await delay(timeout / 3);
            // //enters the list
            input.subject.next(3);
            await delay(timeout);

            // does not enter the first list
            input.subject.next(4);

            await eventually(() => {
                assert.equal(s.callCount, 2);
                assert.deepEqual(s.firstCall.args[0], [1,2,3]);
                assert.deepEqual(s.secondCall.args[0], [4]);
            })

        });

    })
})