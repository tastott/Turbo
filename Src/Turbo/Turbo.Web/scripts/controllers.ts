///<reference path="./typings/angular.d.ts" />
import Service = require('./services/turboService')
import calib = require('./services/calibrator')
import m = require('./models/metric')

var nwgui = (<any>window).require('nw.gui');

export class HomeController {
    public static $inject = [
        '$scope',
    ];

    constructor($scope) {
        $scope.exit = () => {
            nwgui.App.quit();
        }
    }
}

export class CalibrationController {

    constructor(private $scope, private $location : ng.ILocationService) {

        var calibrator = new calib.Calibrator(this.onCalibrationEvent);


        $scope.stop = this.stop;
    }

    stop = () => {
        console.log('Exiting calibration');
        this.$location.path('#/home');
    }

    private onCalibrationEvent(event: calib.CalibrationEvent) {
        switch (event.Type) {
            case calib.EventType.PreCaptureStarted:
                var minSpeed: m.Metric = event.Data.MinSpeed;
                this.$scope.message = 'Accelerate to greater than ' + minSpeed + ' rpm, then stop pedalling.';
            case calib.EventType.CaptureStarted:

        }
    }
}

export class RideController {
    public static $inject = [
        '$scope',
        'turboService',
        '$location'
    ];

    constructor($scope,
        turboService: Service.TurboService,
        $location
        ) {
        $scope.distance = 0;
        $scope.speed = 0;
        $scope.time = 0;
        $scope.currentSpeed = 0;
        $scope.currentCadence = 0;

        var updateTimer: NodeJS.Timer;

        $scope.stopSession = () => {
            console.log('Stopping session...');
            turboService.stopSession()
                .then(id => {
                console.log('Stopped session: ' + id);
                $location.path('#/home');
            });
        };

        turboService.startSession()
            .then(id => {
            console.log('Started new session: ' + id);

            var update = () => {
                $scope.$apply(() => {
                    var data = turboService.getSessionData();
                    if (data) {
                        $scope.distance = data['Wheel']['Distance'] / 1000;
                        $scope.speed = data['Wheel']['AverageSpeed'];
                        $scope.time = data['Wheel']['Timer'];
                        $scope.currentSpeed = data['Wheel']['CurrentAverageSpeed'];
                        $scope.currentCadence = data['Crank']['Cadence'];
                        $scope.realLifeSpeed = data['Wheel']['RealLifeSpeed'];
                    }
                });
            };

            setInterval(update, 2000);
        });


    }
}