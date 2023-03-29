#!/usr/bin/env node

import * as flyde from '@flyde/runtime';

const punchDelay = process.argv
    .map(Number)
    .find(arg => !isNaN(arg)) ?? 2000; // lazy hack for running locally

const execute = flyde.loadFlowByPath('src/DadJokes.flyde');

execute({punchDelay}).result.then(() => console.log('-- Powered by https://dadjokes.io --'));


