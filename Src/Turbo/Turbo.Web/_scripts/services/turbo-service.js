///<reference path="../typings/angular.d.ts"/>
///<reference path="./aggregation.ts" />
///<reference path="./sensor.ts" />
var Service;
(function (Service) {
    var _ = require('underscore');
    var moment = require('moment');
    var path = require('path');

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
//# sourceMappingURL=turbo-service.js.map
