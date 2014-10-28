///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/angular-route.d.ts" />
///<reference path="./home-controller.ts" />
///<reference path="./directives.ts" />

module turbo {
    console.log('inside turbo module');
    angular.module('turboApp', ['ngRoute'])
        .controller('HomeController', controllers.HomeController)
        .directive('segmentDisplay', directives.SegmentDisplay)
        .config(['$routeProvider', ($routeProvider: ng.route.IRouteProvider) =>{
            $routeProvider.when('/home',
                {
                    controller: 'HomeController',
                    templateUrl: 'views/home.html'
                })
                .otherwise({redirectTo: '/home'});
        }]);
}