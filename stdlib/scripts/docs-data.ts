import * as allExported from '../src/all';
import { writeFileSync } from 'fs';
import { isCodePart, isVisualPart, Part } from '@flyde/core';


const parts = Object.fromEntries(
    Object.entries(allExported).filter(([_, value]: [string, unknown]) => isCodePart(value as Part) || isVisualPart(value as Part))
);

writeFileSync('dist/parts.json', JSON.stringify(parts));