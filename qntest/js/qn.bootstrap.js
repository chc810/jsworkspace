/**
 * 基于Bootstrap封装的功能
 * 弹出框（包括确认框，输入框，提示信息）
 */
(function(window, $, APP) {
	"use strict";
	
	/**
	 * 设置ajax请求超时的处理
	 */
	(function ($) {
		$.ajaxSetup({
		    contentType : "application/x-www-form-urlencoded;charset=utf-8",
		    complete : function(xhr, textStatus) {  
		        // session超时
		        if (xhr.status == 911) {  
		        	top.location = APP.ctx;
		        	return;  
		        }  
		    }  
		}); 
	})($);
	
	var qn = {
		modal : function(message, title, okButton, option, callback, isInput, initValue, isConfirm, validateFunc) {
			var $modal = $(".qn-modal");
			option = option || {};
			if (!$modal.get(0)) {
				$modal = this.createModal();
			} 
			if (!title) {
				$modal.find(".modal-header").remove();
			} else {
				var $titleDiv = $modal.find(".modal-header");
				if (!$titleDiv.get(0)) {
					$modal.find(".modal-content").prepend("<div class=\"modal-header\"></div>");
					$titleDiv = $modal.find(".modal-header");
				}
				$titleDiv.html("<h4>" + title + "</h4>");
			}
			if (okButton) {
				var okClass = option.okClass ? option.okClass : "btn-primary";
				var $okButton = $modal.find(".modal-footer button." + okClass);
				if (!$okButton.get(0)) {
					var	okTitle = option.okTitle ? option.okTitle : "确定";
					$modal.find(".modal-footer").html("<button class=\"btn " + okClass + "\">" + okTitle + "</button>");
					$okButton = $modal.find(".modal-footer button." + okClass);
				}
				$okButton.unbind("click");
				$okButton.bind("click", function() {
					
					if (isInput) {
						var $input = $modal.find(".modal-body input");
						// 校验
						if (typeof validateFunc === "function") {
							var validateResult = validateFunc.apply($input.val());
							if (!validateResult) {
								$input.parent().addClass("has-error");
								return;
							} else {
								callback && callback($input.val());
							}
						} else {
							if (callback) {
								// 单输入框值返回
								if ($input.length == 1) {
									callback($input.val());
								} else if ($input.length > 1) {		// 多输入框值返回
									var values = [];
									$input.each(function() {
										values.push($(this).val());
									});
									callback(values);
								}
							}
							
						}
					} else if (isConfirm) {		// 确认框
						callback && callback(true); 
					} else {
						callback && callback(); 
					}
					
					$modal.modal('hide');
				});
			} else {
				$modal.find(".modal-footer button.btn-primary").remove();
			}
			
			// 取消按钮
			if (option.cancelButton) {
				var $cancelButton = $modal.find(".modal-footer button.btn-default");
				if (!$cancelButton.get(0)) {
					$modal.find(".modal-footer").append("<button class=\"btn btn-default\" data-dismiss=\"modal\">取消</button>");
				}
			} else {
				$modal.find(".modal-footer button.btn-default").remove();
			}
			$modal.find(".modal-body").html(message);
			if (initValue) {
				$modal.find(".modal-body input").val(initValue);
			}
			if (option.size) {
				var size = option.size;
				var addClass = "";
				if (size == "L") {
					addClass = "modal-lg";
				} else if (size == "S") {
					addClass = "modal-sm";
				}
				$modal.find(".modal-dialog").removeClass().addClass("modal-dialog");
				if (addClass) {
					$modal.find(".modal-dialog").addClass(addClass);
				}
			} else {
				$modal.find(".modal-dialog").removeClass().addClass("modal-dialog");
			}
			$modal.modal();
		},
		
		/**
		 * 输入框
		 */
		modalInput : function(title, tip, initValue, callback, validateFunc) {
			var body = "<p><input type='text' class='form-control' autofocus><label class='control-label'>" + tip + "</label></p>";
			this.modal(body, title, true, {size:'S', cancelButton:true}, callback, true, initValue, false, validateFunc);
		},
		
		/**
		 * 插入超链接弹出框
		 */
		createLink : function(callback) {
			var body = "<p><input class=\"form-control\" placeholder=\"链接文字\"></p>";
			body += "<p><input class=\"form-control\" placeholder=\"链接地址\"></p>";
			this.modal(body, "插入超链接", true, {size:'S', cancelButton:true}, callback, true, "", false, null);
		},
		
		/**
		 * 确认框
		 */
		confirm : function(message, option, callback) {
			option = option || {};
			this.modal(message, "确认", true, {
				size : 'S', 
				cancelButton : true, 
				okTitle : option.okTitle || "删除", 
				okClass : option.okClass || "btn-danger"
			}, callback, false, null, true);
		},
		
		/**
		 * 页面顶部提示消息
		 */
		tip : function(message, level) {
			var $tip = $("#qn-tip-div");
			if (!$tip.get(0)) {
				$tip = this.createTip();
			}
			$tip.text(message);
			$tip.removeClass("qn-tip-success qn-tip-danger qn-tip-warning");
			level = level || "success";
			$tip.addClass("qn-tip-" + level);
			var tipLeft = ($(window).width() - $tip.width()) / 2;
			$tip.css("left", tipLeft + "px");
			$tip.animate({top: 0}, 500, function() {
				setTimeout(function() {
					$tip.animate({top: -40}, 500);
				}, 2000);
			});
		},
		
		createModal : function() {
			var html = "";
			html += ("<div class=\"qn-modal modal fade\" role=\"dialog\" aria-hidden=\"true\">");
			html += ("	<div class=\"modal-dialog\">");
			html += ("		<div class=\"modal-content\">");
			html += ("			<div class=\"modal-header\"></div>");
			html += ("			<div class=\"modal-body\"></div>");
			html += ("			<div class=\"modal-footer\"></div>");
			html += ("		</div>");
			html += ("	</div>");
			html += ("</div>");
			$(document.body).append(html);
			return $(".qn-modal");
		},
		
		createTip : function() {
			var html = "<div id=\"qn-tip-div\" class=\"qn-tip\"></div>";
			$(document.body).append(html);
			return $("#qn-tip-div");
		},
		
		log : function(msg) {
			if (window.console && window.console.log) {
				console.log(msg);
			}
		},
		
		// 格式化日期时间
		formatDate : function(date, format) {
			if (!format) {
				format = "yyyy-MM-dd";
			}
			
			var o = {
				"M+" : date.getMonth() + 1,
				"d+" : date.getDate(),
				"h+" : date.getHours(),
				"m+" : date.getMinutes(),
				"s+" : date.getSeconds(),
				"q+" : Math.floor((date.getMonth() + 3) / 3),
				"S" : date.getMilliseconds()
			}

			if (/(y+)/.test(format)) {
				format = format.replace(RegExp.$1, (date.getFullYear() + "")
						.substr(4 - RegExp.$1.length));
			}

			for (var k in o) {
				if (new RegExp("(" + k + ")").test(format)) {
					format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
							: ("00" + o[k]).substr(("" + o[k]).length));
				}
			}
			return format;
		}
	};
	
	window.qn = qn;
	
})(window, window.$, window.APP);