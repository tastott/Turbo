///<reference path="./typings/angularjs/angular.d.ts" />
///<reference path="./typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts"/>
import Service = require('./services/turboService')
import calib = require('./services/calibrator')
import m = require('./models/metric')
import sensor = require('./services/sensor')

//import d3 = require('d3')

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

export class CalibrationController {

    constructor(private $scope,
        private $location: ng.ILocationService,
        private $modal : ng.ui.bootstrap.IModalService) {

        $scope.start = this.start;
        $scope.stop = this.stop;
    }

    start = () => {
        
        

        this.CapturePowerCurve(0);
    }

    private CapturePowerCurve(index: number) { //: Q.Promise<calib.PowerCurveResult>{

        var modal = this.$modal.open({
            controller: Names.CalibrationCapture,
            templateUrl: 'views/modals/calibration-capture.html'
        });

        modal.result
            .then(result => {
                console.log(result);
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
        this.$location.path('#/home');
    }

}

export class CalibrationCaptureController {
    private capture: calib.PowerCurveCapture;

    constructor(private $scope,
        private $modalInstance: ng.ui.bootstrap.IModalServiceInstance) {
        $scope.Ok = this.Ok;
        $scope.Cancel = this.Cancel;


        return;
        this.capture = new calib.PowerCurveCapture(() => new sensor.PlaybackSensorListener(dummyData.datasets[0].Wheel),
            () => new sensor.PlaybackSensorListener(dummyData.datasets[0].Crank));

        this.capture.Capture()
            .then(curve => $modalInstance.close(curve))
            .fail(() => {
            $modalInstance.dismiss('Capture failed');
        });           
    }

    Ok = () => {
        this.$modalInstance.close('ok');
    }

    Cancel = () => {
        this.$modalInstance.dismiss('cancel');
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