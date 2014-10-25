var Sensor;
(function (Sensor) {
    var FakeSensorListener = (function () {
        function FakeSensorListener() {
        }
        FakeSensorListener.prototype.start = function (onInput) {
        };
        return FakeSensorListener;
    })();
    Sensor.FakeSensorListener = FakeSensorListener;
})(Sensor || (Sensor = {}));
