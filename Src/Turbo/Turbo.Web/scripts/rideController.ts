///<reference path="./typings/angular.d.ts" />
///<reference path="Services/turboService.ts" />

module controllers {
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
		    
		    $scope.stopSession = () => {
		        console.log('Stopping session...')
		        var sessionId = turboService.stopSession();
		        console.log('Stopped session: ' + sessionId);
		        $location.path('#/home');
		    };

            var sessionId = turboService.startSession();
		    console.log('Started new session: ' + sessionId);

            $scope.update = () => {
                $scope.$apply(() => {
                    var data = turboService.getSessionData();
                    $scope.distance = data.Distance / 1000;
                    $scope.speed = data.AverageSpeed;
                    $scope.time = data.Timer;
                    $scope.currentSpeed = data.CurrentAverageSpeed;
                });
            };
                
		    setInterval($scope.update, 2000);
		}
    }
}