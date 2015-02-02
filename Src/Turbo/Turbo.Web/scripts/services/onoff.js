var onoff = require('onoff');

//if(!process.argv[2]) throw 'No pin number supplied';
var pin = parseInt(process.argv[2]);
var input = new onoff.Gpio(pin, 'in', 'rising', { debounceTimeout: 50 });
input.watch(function (err, value) {
    process.send(new Date().getTime());
});

process.on('exit', function () {
    input.unexport();
});