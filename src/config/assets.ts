import {existsSync, readFileSync} from 'fs';
const file = process.cwd() + '/assets.json';

export default JSON.parse(existsSync(file)
    ? readFileSync(file, 'utf8')
    : readFileSync(file + '.example', 'utf8'));
