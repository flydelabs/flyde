import * as parts from '../src/all';
import { writeFileSync } from 'fs';

writeFileSync('dist/parts.json', JSON.stringify(parts));