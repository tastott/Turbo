///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/angular-route.d.ts" />
///<reference path="./homeController.ts" />
///<reference path="./rideController.ts" />
///<reference path="./directives.ts" />
///<reference path="Services/turbo-service.ts"/>
///<reference path="Services/sensor.ts"/>
var turbo;
(function (turbo) {
    console.log('inside turbo module');
    angular.module('turboApp', ['ngRoute']).service('turboService', function () {
        return new Service.TurboService(new Sensor.FakeSensorListener());
    }).controller('homeController', controllers.HomeController).controller('rideController', controllers.RideController).config([
        '$routeProvider', function ($routeProvider) {
            $routeProvider.when('/ride', {
                controller: 'rideController',
                templateUrl: 'views/ride.html'
            }).when('/home', {
                controller: 'homeController',
                templateUrl: 'views/home.html'
            }).otherwise({ redirectTo: '/home' });
        }]);
})(turbo || (turbo = {}));
//# sourceMappingURL=app.js.map
