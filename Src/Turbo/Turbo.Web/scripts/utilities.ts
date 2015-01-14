///<reference path="typings/node.d.ts" />

module Utilities {
    var _path = require('path');

    export function cwd() {
        return _path.dirname(process.execPath);
    }

    export function resolve(path: string) {
        return _path.resolve(cwd(), path);
    }
}