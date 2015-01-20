///<reference path="typings/node.d.ts" />
///<reference path="typings/node-webkit/node-webkit.d.ts"/>

import nwgui = require('nw.gui');
var minimist = require('minimist');

export function GetCLArgs(){
    var args = minimist(nwgui.App.argv);

    return args;
}
