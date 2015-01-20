///<reference path="./typings/angular.d.ts" />

module controllers {
    export class HomeController {
        public static $inject = [
			'$scope',
		];
		
		constructor($scope){
            $scope.exit = () => {
                require('nw.gui').App.quit();
            }
		}
    }
}