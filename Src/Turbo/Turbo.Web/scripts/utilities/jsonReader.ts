import fs = require('fs')

export function readJsonSync(path: string, throwOnEmpty : boolean = true): any{

    if (!fs.existsSync(path)) throw new Error('JSON file does not exist: ' + path);

    var data = fs.readFileSync(path, 'utf8');
    if (!data) {
        if (throwOnEmpty) throw new Error('JSON file is empty: ' + path);
        else return null;
    }

    data = data.replace(/^\uFEFF/, ''); //https://github.com/joyent/node/issues/1918#issuecomment-2480359

    var parsed = JSON.parse(data);
    if (!parsed) throw new Error('Failed to parse JSON file: ' + path);
        
    return parsed;
}