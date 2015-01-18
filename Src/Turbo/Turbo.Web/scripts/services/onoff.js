var onoff = require('onoff');

if(!process.argv[2]) throw 'No pin number supplied';

var input = new onoff.Gpio(process.argv[2], 'in', 'rising', { debounceTimeout: 50 });
input.watch(function (err, value) {
    process.send(new Date().getTime());
});

process.exit(function () {
    input.unexport();
});