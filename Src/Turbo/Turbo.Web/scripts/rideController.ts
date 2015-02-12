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
                turboService.stopSession()
                    .then(id => {
                        console.log('Stopped session: ' + id);
                        $location.path('#/home');
                    });
		    };

            turboService.startSession()
                .then(id => {
                    console.log('Started new session: ' + id);

                    $scope.update = () => {
                        $scope.$apply(() => {
                            var data = turboService.getSessionData();
                            $scope.distance = data['Wheel']['Distance']  / 1000;
                            $scope.speed = data['Wheel']['AverageSpeed'];
                            $scope.time = data['Wheel']['Timer'];
                            $scope.currentSpeed = data['Wheel']['CurrentAverageSpeed'];
                        });
                    };

                    setInterval($scope.update, 2000);
                });
                
		   
		}
    }
}