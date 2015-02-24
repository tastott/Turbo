///<reference path="./typings/angular.d.ts" />
import Service = require('./services/turboService')
import calib = require('./services/calibrator')
import m = require('./models/metric')
import sensor = require('./services/sensor')

//import d3 = require('d3')

var nwgui = (<any>window).require('nw.gui');
var dummyData = require('./services/data/wheel-stops');

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
    private activeCapture: calib.PowerCurveCapture;

    constructor(private $scope, private $location : ng.ILocationService) {

       

        $scope.start = this.start;
        $scope.stop = this.stop;
    }

    start = () => {
        
        

        this.activeCapture.Capture()
            .then(result => {
            console.log(result);
        });
    }

    private CapturePowerCurve(index: number): Q.Promise<calib.PowerCurveResult>{
        this.activeCapture = new calib.PowerCurveCapture(() => new sensor.PlaybackSensorListener(dummyData.datasets[0].Wheel),
            () => new sensor.PlaybackSensorListener(dummyData.datasets[0].Crank));

        return this.activeCapture.Capture()
            .fail(() => {
                return this.CapturePowerCurve(index); //Just do it again!
            });
    }

    //chartPowerCurve(curveResult: calib.PowerCurveResult) {

    //    var svg = d3.select('body')
    //        .append('svg')
    //        .attr('width', 300)
    //        .attr('height', 200);

    //    var xScale = d3.scale.linear().range([0, 300]);
    //    var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    //    var yScale = d3.scale.linear().range([0, 200]);
    //    var yAxis = d3.svg.axis().scale(yScale).orient("left");

        
    //}

    stop = () => {
        console.log('Exiting calibration');
        (this.activeCapture ? this.activeCapture.Stop() : Q(<void>null))
            .then(() => this.$location.path('#/home'));
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
        $scope.currentPower = 0;

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
                        $scope.currentPower = data['Wheel']['CurrentPower'];
                    }
                });
            };

            setInterval(update, 2000);
        });


    }
}