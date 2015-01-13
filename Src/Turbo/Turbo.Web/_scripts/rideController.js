///<reference path="./typings/angular.d.ts" />
///<reference path="Services/turbo-service.ts" />
var controllers;
(function (controllers) {
    var RideController = (function () {
        function RideController($scope, turboService, $location) {
            $scope.distance = 0;
            $scope.speed = 0;
            $scope.time = 0;
            $scope.currentSpeed = 0;

            $scope.stopSession = function () {
                console.log('Stopping session...');
                var sessionId = turboService.stopSession();
                console.log('Stopped session: ' + sessionId);
                $location.path('#/home');
            };

            var sessionId = turboService.startSession();
            console.log('Started new session: ' + sessionId);

            $scope.update = function () {
                $scope.$apply(function () {
                    var data = turboService.getSessionData();
                    $scope.distance = data.Distance / 1000;
                    $scope.speed = data.AverageSpeed;
                    $scope.time = data.Timer;
                    $scope.currentSpeed = data.CurrentAverageSpeed;
                });
            };

            setInterval($scope.update, 2000);
        }
        RideController.$inject = [
            '$scope',
            'turboService',
            '$location'
        ];
        return RideController;
    })();
    controllers.RideController = RideController;
})(controllers || (controllers = {}));
//# sourceMappingURL=rideController.js.map
