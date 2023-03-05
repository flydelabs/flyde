#!/usr/bin/env node

import * as flyde from '@flyde/runtime';

var wtf = require('wtfnode');


const punchDelay = process.argv
    .map(Number)
    .find(arg => !isNaN(arg)) ?? 2000; // lazy hack for running locally

const execute = flyde.loadFlow('src/DadJokes.flyde');

execute({punchDelay}).then(() => console.log('-- Powered by https://dadjokes.io --'));


