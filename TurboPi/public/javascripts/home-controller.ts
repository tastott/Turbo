///<reference path="./typings/angular.d.ts" />

module controllers {
    export class HomeController {
        public static $inject = [
			'$scope',
			'$http'
		];
		
		constructor($scope, $http){
		    $scope.distance = 0;
		    $scope.speed = 0;
		    $scope.time = 0;
		    
		    setInterval(() => {
		        $http.get('/api')
		            .success(data => {
		                $scope.distance = data.Distance / 1000;
		                $scope.speed = data.AverageSpeed;
		                $scope.time = data.Timer;
		            });
		    }, 2000);
		}
    }
}