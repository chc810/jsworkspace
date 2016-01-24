$(function(){
	
	$("#loginBtn").click(function(){
		openMask();
		openLogin();
	});

	$("#mask").click(function(){
		$("#login").css("display","none");
		closeMask();
	});

	
	function openMask() {
		var allHeight = document.body.scrollHeight;
		$("#mask").css("height",allHeight + "px");
		$("#mask").css("display","block");
	};

	function closeMask() {
		$("#mask").css("display","none");
	};

	function resize() {
		var left = (document.documentElement.clientWidth  - $("#login").width()) / 2
		var top = (document.documentElement.clientHeight   - $("#login").height()) / 2;
		$("#login").css("display","block");
		$("#login").css("left", left + "px");
		$("#login").css("top", top + "px");
	}


	function openLogin() {
		resize();
		$("#login .login_header div").click(function(){
			$("#login").css("display","none");
			closeMask();
		});

	}

});
