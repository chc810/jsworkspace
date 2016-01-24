var myApp = angular.module("myApp",[]);
myApp.controller("mycontroller",["$scope",function($scope){
	$scope.maskState = {
		show : false
	};
	$scope.loginState = {
		show : false
	};
	$scope.doLogin = function(){
		openMask();
		openLogin();
	}
	$scope.doLoginClose = function(){
		$scope.loginState.show = false;
		$scope.maskState.show = false;
	}

	function openMask() {
		var allHeight = document.body.scrollHeight;
		$("#mask").css("height",allHeight + "px");
		$scope.maskState.show = true;
	};
	function openLogin() {
		console.info($("#login")[0].clientWidth);
		var left = (document.documentElement.clientWidth  - $("#login")[0].clientWidth) / 2
		var top = (document.documentElement.clientHeight   - $("#login")[0].clientHeight) / 2;
		console.info(document.documentElement.clientWidth);
		console.info($("#login")[0]);
		$("#login").css("left", left + "px");
		$("#login").css("top", top + "px");
		$scope.loginState.show = true;
		$("#login .login_header div").click(function(){
			$scope.loginState.show = false;
			$scope.maskState.show = false;
		});
	}
}]);