///<reference path="./typings/angular.d.ts" />
var controllers;
(function (controllers) {
    var HomeController = (function () {
        function HomeController($scope, $http) {
        }
        HomeController.$inject = [
            '$scope',
            '$http'
        ];
        return HomeController;
    })();
    controllers.HomeController = HomeController;
})(controllers || (controllers = {}));
