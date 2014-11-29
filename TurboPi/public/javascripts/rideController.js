///<reference path="./typings/angular.d.ts" />
var controllers;
(function (controllers) {
    var RideController = (function () {
        function RideController($scope, $http, $location) {
            $scope.distance = 0;
            $scope.speed = 0;
            $scope.time = 0;
            $scope.currentSpeed = 0;

            $scope.stopSession = function () {
                console.log('Stopping session...');
                $http.get('/api/stop').success(function (sessionId) {
                    console.log('Stopped session: ' + sessionId);
                    $location.path('#/home');
                });
            };

            $http.get('/api/start').success(function (sessionId) {
                console.log('Started new session: ' + sessionId);

                setInterval(function () {
                    $http.get('/api/data').success(function (data) {
                        $scope.distance = data.Distance / 1000;
                        $scope.speed = data.AverageSpeed;
                        $scope.time = data.Timer;
                        $scope.currentSpeed = data.CurrentAverageSpeed;
                    });
                }, 2000);
            });
        }
        RideController.$inject = [
            '$scope',
            '$http',
            '$location'
        ];
        return RideController;
    })();
    controllers.RideController = RideController;
})(controllers || (controllers = {}));
