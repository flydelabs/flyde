#!/usr/bin/env node

import * as flyde from '@flyde/runtime';

const punchDelay = process.argv
    .map(Number)
    .find(arg => !isNaN(arg)) ?? 2000; // lazy hack for it to work when running locally as well

const execute = flyde.loadFlow('src/DadJokes.flyde');

execute({punchDelay});



