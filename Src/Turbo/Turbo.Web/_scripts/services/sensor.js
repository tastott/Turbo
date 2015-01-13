var Sensor;
(function (Sensor) {
    var FakeSensorListener = (function () {
        function FakeSensorListener() {
        }
        FakeSensorListener.prototype.start = function (onInput) {
            this.randomSense(onInput);
        };

        FakeSensorListener.prototype.stop = function (onStopped) {
            if (onStopped)
                setTimeout(onStopped());
        };

        FakeSensorListener.prototype.randomSense = function (onInput) {
            var _this = this;
            var delay = 200 + (Math.random() * 50);
            setTimeout(function () {
                onInput(new Date().getTime());
                _this.randomSense(onInput);
            }, delay);
        };
        return FakeSensorListener;
    })();
    Sensor.FakeSensorListener = FakeSensorListener;

    var PythonSensorListener = (function () {
        function PythonSensorListener(pin) {
        }
        PythonSensorListener.prototype.start = function (onInput) {
            var _this = this;
            var pythonPath = require('path').resolve(__dirname, 'test.py');
            var childProcess = require('child_process');
            this._gpioProcess = childProcess.spawn('python', [pythonPath]);
            this._gpioProcess.stdout.on('data', function (data) {
                onInput(data);
            });
            this._gpioProcess.stderr.on('data', function (data) {
                console.log('Error in python process: ' + data);
            });
            process.on('SIGTERM', function () {
                _this.stop();
            });
        };

        PythonSensorListener.prototype.stop = function (onStopped) {
            this._gpioProcess.kill();
            if (onStopped)
                onStopped();
        };
        return PythonSensorListener;
    })();
    Sensor.PythonSensorListener = PythonSensorListener;
})(Sensor || (Sensor = {}));
//# sourceMappingURL=sensor.js.map
