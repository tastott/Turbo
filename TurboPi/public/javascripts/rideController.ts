///<reference path="./typings/angular.d.ts" />

module controllers {
    export class RideController {
        public static $inject = [
			'$scope',
			'$http',
			'$location'
		];
		
		constructor($scope, $http, $location){
		    $scope.distance = 0;
		    $scope.speed = 0;
		    $scope.time = 0;
		    $scope.currentSpeed = 0;
		    
		    $scope.stopSession = () => {
		        console.log('Stopping session...')
		        $http.get('/api/stop')
		            .success(sessionId => {
		                console.log('Stopped session: ' + sessionId);
		                $location.path('#/home');
		            });
		    };
		    
		    $http.get('/api/start')
		        .success(sessionId => {
		            console.log('Started new session: ' + sessionId);
		            
		             setInterval(() => {
        		        $http.get('/api/data')
        		            .success(data => {
        		                $scope.distance = data.Distance / 1000;
        		                $scope.speed = data.AverageSpeed;
        		                $scope.time = data.Timer;
        		                $scope.currentSpeed = data.CurrentAverageSpeed;
        		            });
        		    }, 2000);
		        });
		}
    }
}