///<reference path="./typings/angular.d.ts" />
///<reference path="Services/turboService.ts" />
///<reference path="./typings/node.d.ts" />
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
		    
            var updateTimer : NodeJS.Timer;

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
                            }
                        });
                    };

                    setInterval(update, 2000);
                });
                
		   
		}
    }
}