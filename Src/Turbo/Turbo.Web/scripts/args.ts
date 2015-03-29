///<reference path="typings/node/node.d.ts" />

var nwgui = (<any>window).require('nw.gui');
var minimist = require('minimist');

export function GetCLArgs():any{
    var args = minimist(nwgui.App.argv);
    
    return args;
}
