///<reference path="./typings/angularjs/angular.d.ts" />
///<reference path="./typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts"/>
import Service = require('./services/turboService')
import calib = require('./services/calibrator')
import m = require('./models/metric')
import sensor = require('./services/sensor')
import _ = require('underscore')
import prom = require('./utilities/promises')
import Q = require('q')
import cs = require('./services/configService')
import ls = require('./services/logService')
import ss = require('./services/sensorService')

var _devMode: boolean = require('./args').GetCLArgs()['dev-mode'];

var nwgui = (<any>window).require('nw.gui');
var dummyData = require('./services/data/wheel-stops');

export var Names = {
    Home: 'homeController',
    Ride: 'rideController',
    Calibrate: 'calibrateController',
    CalibrationCapture: 'calibrationCaptureController'
};

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

export interface CalibrationControllerScope extends ng.IScope {
    Start: () => void;
    Exit: () => void;
    Accept: () => void;
    CurveResult: calib.PowerCurveResult;
}

export class CalibrationController {

    private curves: calib.PowerCurveResult[];

    constructor(private $scope : CalibrationControllerScope,
        private $location: ng.ILocationService,
        private $modal: ng.ui.bootstrap.IModalService,
        private config: cs.ConfigService,
        private logger: ls.LogService) {

        $scope.Start = this.start;
        $scope.Exit = this.stop;
        $scope.Accept = this.accept;

        this.curves = [];
    }

    accept = () => {

        if (!this.$scope.CurveResult || !this.$scope.CurveResult.Curve)
            throw 'No curve to save';

        this.logger.Info("New power curve accepted.", { curve: this.$scope.CurveResult.Curve });
        this.config.SetPowerCurve(this.$scope.CurveResult.Curve);
        this.$location.path('#/home');
    }

    start = () => {

        this.logger.Info('Starting calibration');

        this.curves = [];
        this.$scope.CurveResult = null;

        var results: calib.PowerCurveResult[] = [];

        prom.AllInSequence(_.range(3).map(i => () => this.CapturePowerCurve(i)))
            .then((curves: calib.PowerCurveResult[]) => {
                this.logger.Info('Aggregating power curve data', { captures: curves.length });
                var agg = calib.AggregateCurveResults(curves);
                


                if (!_devMode) this.$scope.CurveResult = agg;
                else {
                    this.$scope.CurveResult = {
                        Curve: {
                            Coefficient: 1,
                            Exponent: 2,
                            Fit: 0.95
                        },
                        Data: [
                            { Power: 1, Speed: 1 },
                            { Power: 1, Speed: 1 }
                        ],
                        IgnoredData: [
                            { Power: 1, Speed: 1 },
                        ]
                    };
                }
            })
            .fail(error => {
                this.logger.Info("Capture aborted or failed", { error: error });
            });
    }

    private CapturePowerCurve(ordinal: number) : ng.IPromise<calib.PowerCurveResult>{

        var modal = this.$modal.open({
            controller: Names.CalibrationCapture,
            templateUrl: 'views/modals/calibration-capture.html',
            resolve: {
                ordinal: () => ordinal
            }
        });

        return modal.result;   
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
        this.logger.Info('Exiting calibration');
        this.$location.path('#/home');
    }

}

export interface CalibrationCaptureScope extends ng.IScope {
    Ok(): void;
    Cancel(): void;
    Redo(): void;
    CurveResult: calib.PowerCurveResult;
    WheelSpeedKph: number;
    IgnoredDataProportion: () => number;
}

export class CalibrationCaptureController {
    private capture: calib.PowerCurveCapture;
    private captureInterval: ng.IPromise<any>;

    constructor(private $scope: CalibrationCaptureScope,
        private $interval : ng.IIntervalService,
        private $modalInstance: ng.ui.bootstrap.IModalServiceInstance,
        private ordinal: number,
        private sensorService: ss.SensorService,
        private logger : ls.LogService) {
        $scope.Ok = this.Ok;
        $scope.Cancel = this.Cancel;
        $scope.Redo = this.Redo;
        $scope.CurveResult = null;

        $scope.IgnoredDataProportion = () => {
            if ($scope.CurveResult
                && $scope.CurveResult.Data
                && $scope.CurveResult.IgnoredData
                && $scope.CurveResult.Data.length + $scope.CurveResult.IgnoredData.length) {

                return $scope.CurveResult.IgnoredData.length / ($scope.CurveResult.Data.length + $scope.CurveResult.IgnoredData.length);

            }
            else return null;
               
        };

        if (!_devMode) {
            this.StartCapture();
        }
        else {
            $scope.CurveResult = {
                Curve: {
                    Coefficient: 1,
                    Exponent: 2,
                    Fit: 0.95
                },
                Data: [
                    { Power: 1, Speed: 1 },
                    { Power: 1, Speed: 1 }
                ],
                IgnoredData: [
                    { Power: 1, Speed: 1 },
                ]
            };
        }
    }

    private StartCapture(): void {

        this.logger.Info("Starting power curve capture", { oridinal: this.ordinal });

        if (this.capture != null) throw 'Capture already started.';

        if (!_devMode) {
            this.capture = new calib.PowerCurveCapture(
                () => this.sensorService.MakeSensor(ss.SensorType.Wheel),
                () => this.sensorService.MakeSensor(ss.SensorType.Crank)
             );
        }
        else {
            this.capture = new calib.PowerCurveCapture(() => new sensor.PlaybackSensorListener(dummyData.datasets[this.ordinal].Wheel, 3),
                () => new sensor.PlaybackSensorListener(dummyData.datasets[this.ordinal].Crank, 3));
        }

        this.capture.Capture()
            .then(result => {
                if (result.ErrorMessage) {
                    this.logger.Info("Finished power curve capture.", { ordinal: this.ordinal, curve: result.Curve});
                    this.$scope.$apply(() => this.$scope.CurveResult = result);
                }
                else {
                    this.logger.Info("Power curve capture failed.", { ordinal: this.ordinal, curveError: result.ErrorMessage });
                    this.$modalInstance.dismiss('Capture failed');
                }
            })
            .fail(() => {
                this.$modalInstance.dismiss('Capture failed');
            });
        
        this.captureInterval = this.$interval(
            () => {
                var data = this.capture.GetData();
                this.$scope.WheelSpeedKph = m.Convert(_.find(data, metric => metric.Name == 'Wheel speed'), m.Unit.KilometresPerHour);
            },
            1000
        );       
    }

    private FinishCapture() : Q.Promise<void>{
        if(this.captureInterval) this.$interval.cancel(this.captureInterval);

        if (this.capture) return this.capture.Stop();
        else return Q(<void>null);
    }

    Ok = () => {
        this.FinishCapture()
            .then(() => {
                this.$modalInstance.close(this.$scope.CurveResult);
            });
    }

    Cancel = () => {
        this.FinishCapture()
            .then(() => {
                this.$modalInstance.dismiss('Cancel');
            });
    }

    Redo = () => {

        this.$scope.CurveResult = null;
        this.FinishCapture()
            .then(() => {
                this.StartCapture();
            });
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
        $location : ng.ILocationService
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