var formApp = angular.module('formApp',[]);
formApp.controller('formCtrl',['$scope',function($scope){
	$scope.userInfo = {
		email : "cc@ddd.com",
		pass : "ddddd",
		autoChecked : true
	};
	$scope.getInfo = function() {
		alert("email=" + $scope.userInfo.email + ",pass=" + $scope.userInfo.pass + ",autoChecked=" + $scope.userInfo.autoChecked);
	};
	$scope.setInfo = function() {
		$scope.userInfo = {
		email : "cc@qq.com",
		pass : "ccc",
		autoChecked : true
	};
	}

}]);