import { promises as fs } from 'fs';

export function storeLog (data: string) {
    return fs.appendFile('history.log', `${Date.now()}: ${data}\n`, 'utf-8');
}