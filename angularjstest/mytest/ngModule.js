var ngModule = angular.module('ngModule',[]);
ngModule.controller('moduleCtrl',['$scope', function($scope) {
	$scope.greeting = "hello";
}]);