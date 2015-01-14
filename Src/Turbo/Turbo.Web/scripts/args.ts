///<reference path="typings/node.d.ts" />

module Args {

    var nwgui = require('nw.gui');
    var minimist = require('minimist');

    export function GetCLArgs(){
        var args = minimist(nwgui.App.argv);

        return args;
    }

}