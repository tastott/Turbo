///<reference path="../typings/node.d.ts" />
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
//# sourceMappingURL=aggregation.js.map
