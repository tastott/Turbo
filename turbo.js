var Aggregation;
(function (Aggregation) {
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
})(Aggregation || (Aggregation = {}));
///<reference path="./sensor.ts"/>
///<reference path="./aggregation.ts" />
///<reference path="./turbo-server.ts" />
///<reference path="./turbo-service.ts" />

var x;
(function (x) {
    exports.Sensor = Sensor;
    exports.Aggregation = Aggregation;
    exports.Service = Service;
    exports.Server = Server;
})(x || (x = {}));
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
            var childProcess = require('child_process');
            this._gpioProcess = childProcess.spawn('python', ['test.py']);
            this._gpioProcess.stdout.on('data', function (data) {
                onInput(data);
            });
            this._gpioProcess.stderr.on('data', function (data) {
                console.log('Error in python process: ' + data);
            });
        };

        PythonSensorListener.prototype.stop = function (onStopped) {
            this._gpioProcess.kill();
            onStopped();
        };
        return PythonSensorListener;
    })();
    Sensor.PythonSensorListener = PythonSensorListener;
})(Sensor || (Sensor = {}));
///<reference path="./typings/node.d.ts" />
///<reference path="./typings/restify.d.ts" />
var Server;
(function (Server) {
    var restify = require('restify');

    var TurboServer = (function () {
        function TurboServer() {
            var sensor = new Sensor.FakeSensorListener();
            this._service = new Service.TurboService(sensor);
        }
        TurboServer.prototype.start = function () {
            var _this = this;
            var server = restify.createServer();
            server.use(restify.CORS());

            server.get('/test', function (req, res, next) {
                res.send({
                    hello: _this._service.get()
                });
                next();
            });

            this._service.start();

            server.listen(8080, function () {
                console.log('%s listening at %s', server.name, server.url);
            });
        };

        TurboServer.prototype.stop = function (onStopped) {
            this._service.stop(onStopped);
        };
        return TurboServer;
    })();
    Server.TurboServer = TurboServer;
})(Server || (Server = {}));
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
                    ;
                    _this._aggs[aggName].Put(time);
                });
            });
        };

        TurboService.prototype.stop = function (onStopped) {
            this._sensor.stop(onStopped);
        };

        TurboService.prototype.get = function () {
            return this._aggs['Count'].Value();
        };
        return TurboService;
    })();
    Service.TurboService = TurboService;
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
    exports.Server = Server;

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
