///<reference path="./typings/node.d.ts" />
//import fs= require('fs');
var Aggregation;
(function (Aggregation) {
    var fs = require('fs');

    var Counter = (function () {
        function Counter() {
            this._count = 0;
        }
        Counter.prototype.Put = function (time) {
            this._count += 1;
        };

        Counter.prototype.Value = function () {
            return this._count;
        };
        return Counter;
    })();
    Aggregation.Counter = Counter;

    var Odometer = (function () {
        function Odometer(unitDistance) {
            this.unitDistance = unitDistance;
            this._count = 0;
        }
        Odometer.prototype.Put = function (time) {
            this._count += 1;
        };

        Odometer.prototype.Value = function () {
            return this._count * this.unitDistance;
        };
        return Odometer;
    })();
    Aggregation.Odometer = Odometer;

    var Timer = (function () {
        function Timer() {
            this._start = 0;
            this._latest = 0;
        }
        Timer.prototype.Put = function (time) {
            if (!this._start)
                this._start = time;
            this._latest = time;
        };

        Timer.prototype.Value = function () {
            return this._latest - this._start;
        };
        return Timer;
    })();
    Aggregation.Timer = Timer;

    var Speedometer = (function () {
        function Speedometer(odometer, timer) {
            this.odometer = odometer;
            this.timer = timer;
        }
        Speedometer.prototype.Put = function (time) {
        };

        Speedometer.prototype.Value = function () {
            var distanceKm = this.odometer.Value() / 1000;
            var hours = this.timer.Value() / 3600000;

            if (!hours)
                return 0;
            else
                return distanceKm / hours;
        };
        return Speedometer;
    })();
    Aggregation.Speedometer = Speedometer;

    var RollingSpeedometer = (function () {
        function RollingSpeedometer(windowLength, unitDistance) {
            this.windowLength = windowLength;
            this.unitDistance = unitDistance;
            this._times = [];
        }
        RollingSpeedometer.prototype.Put = function (time) {
            var now = new Date().getTime();
            while (this._times.length && now - this._times[0] > this.windowLength) {
                this._times.shift();
            }
            this._times.push(time);
        };

        RollingSpeedometer.prototype.Value = function () {
            var now = new Date().getTime();
            while (this._times.length && now - this._times[0] > this.windowLength) {
                this._times.shift();
            }

            if (!this._times.length)
                return 0;
            else {
                var distanceKm = this._times.length * this.unitDistance / 1000;
                var hours = (now - this._times[0]) / 3600000;

                if (!hours)
                    return 0;
                else
                    return distanceKm / hours;
            }
        };
        return RollingSpeedometer;
    })();
    Aggregation.RollingSpeedometer = RollingSpeedometer;

    var LogFile = (function () {
        function LogFile(filePath, bufferSize) {
            this.filePath = filePath;
            this.bufferSize = bufferSize;
            this._buffer = [];
        }
        LogFile.prototype.Flush = function () {
            var data = this._buffer.map(function (d) {
                return '\r\n' + d;
            }).join('');
            fs.appendFile(this.filePath, data);
            this._buffer = [];
        };

        LogFile.prototype.Put = function (time) {
            this._buffer.push(time);

            if (this._buffer.length > this.bufferSize)
                this.Flush();
        };

        LogFile.prototype.Value = function () {
            return this.filePath;
        };

        LogFile.prototype.Dispose = function () {
            if (this._buffer.length)
                this.Flush();
        };
        return LogFile;
    })();
    Aggregation.LogFile = LogFile;
})(Aggregation || (Aggregation = {}));
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
            var childProcess = require('child_process');
            this._gpioProcess = childProcess.spawn('python', ['test.py']);
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
///<reference path="./aggregation.ts" />
///<reference path="./sensor.ts" />
var Service;
(function (Service) {
    var _ = require('underscore');
    var moment = require('moment');

    var TurboService = (function () {
        function TurboService(sensor) {
            var _this = this;
            this._sensor = sensor;
            this._sensor.start(function (time) {
                if (_this._session)
                    _this._session.update(time);
            });
        }
        TurboService.prototype.startSession = function () {
            if (this._session)
                this._session.dispose();

            var id = moment().format('YYYYMMDDHHmmss');
            this._session = new TurboSession(id);

            return id;
        };

        TurboService.prototype.stopSession = function () {
            if (this._session) {
                var id = this._session.id;
                this._session.dispose();
                this._session = null;
                return id;
            } else
                return null;
        };

        TurboService.prototype.stop = function (onStopped) {
            this._sensor.stop(onStopped);
        };

        TurboService.prototype.getSessionData = function () {
            if (this._session) {
                return _.object(_.map(this._session.aggregators, function (agg, key) {
                    return [key, agg.Value()];
                }));
            } else
                return null;
        };
        return TurboService;
    })();
    Service.TurboService = TurboService;

    var TurboSession = (function () {
        function TurboSession(id) {
            this.id = id;
            var counter = new Aggregation.Counter();
            var odometer = new Aggregation.Odometer(2);
            var timer = new Aggregation.Timer();
            var speedo = new Aggregation.Speedometer(odometer, timer);

            this.aggregators = {};
            this.aggregators['Count'] = counter;
            this.aggregators['Timer'] = timer;
            this.aggregators['AverageSpeed'] = speedo;
            this.aggregators['CurrentAverageSpeed'] = new Aggregation.RollingSpeedometer(3000, 2);
            this.aggregators['Distance'] = odometer;
            this.aggregators['LogFile'] = new Aggregation.LogFile('logs/' + id + '.log', 100);
        }
        TurboSession.prototype.update = function (time) {
            _.values(this.aggregators).forEach(function (agg) {
                agg.Put(time);
            });
        };

        TurboSession.prototype.dispose = function () {
            _.values(this.aggregators).filter(function (agg) {
                return agg.Dispose;
            }).forEach(function (agg) {
                agg.Dispose();
            });
        };
        return TurboSession;
    })();
})(Service || (Service = {}));
///<reference path="./sensor.ts"/>
///<reference path="./aggregation.ts" />
///<reference path="./turbo-server.ts" />
///<reference path="./turbo-service.ts" />

var x;
(function (x) {
    exports.Sensor = Sensor;
    exports.Aggregation = Aggregation;
    exports.Service = Service;

    var y = (function () {
        function y() {
        }
        y.prototype.z = function () {
            console.log('blah');
        };
        return y;
    })();
    x.y = y;
})(x || (x = {}));
