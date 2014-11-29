///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/angular-route.d.ts" />
///<reference path="./homeController.ts" />
///<reference path="./rideController.ts" />
///<reference path="./directives.ts" />
var turbo;
(function (turbo) {
    console.log('inside turbo module');
    angular.module('turboApp', ['ngRoute']).controller('HomeController', controllers.HomeController).controller('RideController', controllers.RideController).directive('segmentDisplay', directives.SegmentDisplay).config([
        '$routeProvider', function ($routeProvider) {
            $routeProvider.when('/ride', {
                controller: 'RideController',
                templateUrl: 'views/ride.html'
            }).when('/home', {
                controller: 'HomeController',
                templateUrl: 'views/home.html'
            }).otherwise({ redirectTo: '/home' });
        }]);
})(turbo || (turbo = {}));
