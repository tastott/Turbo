var Sensor;
(function (Sensor) {
    var FakeSensorListener = (function () {
        function FakeSensorListener() {
        }
        FakeSensorListener.prototype.start = function (onInput) {
            this.randomSense(onInput);
        };

        FakeSensorListener.prototype.stop = function (onStopped) {
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
})(Sensor || (Sensor = {}));
///<reference path="./aggregation.ts" />
///<reference path="./sensor.ts" />
var Service;
(function (Service) {
    var TurboService = (function () {
        function TurboService(sensor) {
            this._sensor = sensor;
            this._aggs = {};
            this._aggs['Count'] = new Aggregation.Counter();
        }
        TurboService.prototype.start = function () {
            var _this = this;
            this._sensor.start(function (time) {
                Object.keys(_this._aggs).forEach(function (aggName) {
                    _this._aggs[aggName].Put(time);
                });
            });
        };

        TurboService.prototype.get = function () {
            return this._aggs['Count'].Value();
        };
        return TurboService;
    })();
    Service.TurboService = TurboService;
})(Service || (Service = {}));
var Aggregation;
(function (Aggregation) {
    var Counter = (function () {
        function Counter() {
            this._count = 0;
        }
        Counter.prototype.Put = function (time) {
            ++this._count;
        };

        Counter.prototype.Value = function () {
            return this._count;
        };
        return Counter;
    })();
    Aggregation.Counter = Counter;
})(Aggregation || (Aggregation = {}));
