///<reference path="typings/node.d.ts" />

import Args = require('./args')

var _path = require('path');

export function cwd() {
    return Args.GetCLArgs().cwd || _path.dirname(process.execPath);
}

export function resolve(path: string) {
    return _path.resolve(cwd(), path);
}
