var cssApp = angular.module("cssApp",[]);
cssApp.controller("cssCtrl",['$scope',function($scope){
	$scope.message = "我是红色";
	$scope.color = "red";
	$scope.change = function() {
		$scope.message = "我是绿色";
	$scope.color = "green";
	}
}]);

cssApp.controller('mycssCtrl',['$scope', function($scope){
	$scope.message = "我是红色";
	$scope.isRed = true;
	$scope.isGreen = false;
	$scope.change = function() {
		$scope.message = "我是绿色";
		$scope.isGreen = !$scope.isGreen;
		$scope.isRed = !$scope.isRed;
	}
}]);