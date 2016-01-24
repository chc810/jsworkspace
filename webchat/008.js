/**
 * Web坐席端集成脚本
 * Channelsoft
 * Version: 2.0.19613
 * Date: 2014-07-31
 */
(function() {
	"use strict";
	
	var qnConfig = {
		/**
		 * 服务端IP和端口
		 */
		host : "58.247.178.99:10080",
		/**
		 * 企业编号
		 */
		entId : "008",
		/**
		 * 是否正式集成到韵达系统
		 */
		integrated : false
	};
	
	var qn = {
		
		config : {
			nodeServer : "http://" + qnConfig.host,
			jQuery : "http://" + qnConfig.host + "/resource/js/jquery/jquery-1.9.1.min.js",
			knockout : "http://" + qnConfig.host + "/resource/js/knockout/knockout-3.1.0.js",
			style : "http://" + qnConfig.host + "/resource/css/default.css",
			autoComplete : "http://" + qnConfig.host + "/resource/js/qnac/qn.autocomplete.js",
			autoCompleteStyle : "http://" + qnConfig.host + "/resource/js/qnac/qn.autocomplete.css",
			jqueryCookie : "http://" + qnConfig.host + "/resource/js/jquery/jquery.cookie.js",
			json : "http://" + qnConfig.host + "/resource/js/json.js",
			
			ccodServer : "http://" + qnConfig.host + "/agentProxy"
		},
			
		agentStatus : {
			// 初始化
			INIT : "初始化",
			// 登录
			LOGIN : "登录",
			// 登出
			LOGOUT : "登出",
			// 就绪
			READY : "就绪",
			// 正在呼叫
			CONNECTING : "正在呼叫",
			// 振铃
			AGENT_ALERTING : "坐席振铃",
			// 坐席接通
			AGENT_CONNECTED : "坐席接通",
			// 客户接通
			CONNECTED : "双方通话",
			// 挂断
			DISCONNECTED : "挂断",
			// 置忙
			BUSY : "置忙",
			// 保持
			HOLD : "保持",
			// 正在咨询
			CONSULTING : "正在咨询",
			// 咨询通话(主动)
			CONSULTED : "咨询中",
			// 咨询通话(被动)
			CONSULTED_B : "被咨询中",
			// 正在会议
			CONFERENCING : "正在会议",
			// 会议中
			CONFERENCED : "会议中",
			// 正在监听
			OBSERVING : "正在监听",
			// 监听接通
			OBSERVED : "监听中",
			// 正在强插
			INSERTING : "正在强插",
			// 正在强拆
			ABORTING : "正在强拆"
		},

		//坐席状态转换，用于对外事件
		agentStatusConvert : {
			// 初始化
			初始化 : "INIT",
			// 登录
			登录 : "LOGIN",
			// 登出
			登出 : "LOGOUT",
			// 就绪
			就绪 : "READY",
			// 正在呼叫
			正在呼叫 : "CONNECTING",
			// 振铃
			坐席振铃 : "AGENT_ALERTING",
			// 坐席接通
			坐席接通 : "AGENT_CONNECTED",
			// 客户接通
			双方通话 : "CONNECTED",
			// 挂断
			挂断 : "DISCONNECTED",
			// 置忙
			置忙 : "BUSY",
			// 保持
			保持 : "HOLD",
			// 正在咨询
			正在咨询 : "CONSULTING",
			// 咨询通话(主动)
			咨询中 : "CONSULTED",
			// 咨询通话(被动)
			被咨询中 : "CONSULTED_B",
			// 正在会议
			正在会议 : "CONFERENCING",
			// 会议中
			会议中 : "CONFERENCED",
			// 正在监听
			正在监听 : "OBSERVING",
			// 监听接通
			监听中 : "OBSERVED",
			// 正在强插
			正在强插 : "INSERTING",
			// 正在强拆
			正在强拆 : "ABORTING"
		},
		
		// 打印浏览器log日志
		log : function(message) {
			if (window.console && window.console.log) {
				console.log(message);
			}
		},
		
		// 打印浏览器error日志
		error : function(message) {
			if (window.console && window.console.error) {
				console.error(message);
			}
		},
		
		bindEvents : function() {
			this.log("开始绑定事件...");
			$(".qn-button").bind("mousedown", function() {
				$(this).addClass("qn-button-shadow");
			}).bind("mouseup", function() {
				$(this).removeClass("qn-button-shadow");
			}).bind("mouseleave", function() {
				$(this).removeClass("qn-button-shadow");
			});
			
			// 集成环境下，回车不触发外呼
			if (!qnConfig.integrated) {
				$("#outCallNumberInput").bind("keypress", function(e) {
					var event = window.event || e;
					if (event.keyCode == 13 && $.trim($(this).val()) != "") {
						qn.viewModelObj.setCall({
							entId : qn.viewModelObj.entId(),
							agentId : qn.viewModelObj.agentId(),
							number : $(this).val()
						});
					}
				});
			}
			
			// 控制主界面的显示/隐藏
			$("#qn_icon").bind("click", function() {
				if (qn.viewModelObj.visible()) {
					$("#qn").animate({width : "0px"}, function() {
						qn.viewModelObj.visible(false);
					});
				} else {
					$("#qn").css("width", "0px");
					qn.viewModelObj.visible(true);
					$("#qn").animate({width : "330px"});
				}
			});
			this.log("绑定事件完毕");
		},
		
		connectNodeServer : function(agentId, entId) {
			if (window.io) {
				var socket = io.connect(this.config.nodeServer);
				socket.on("connect", function() {
					qn.log("socket.io连接建立成功");
					socket.emit("data", agentId + "@" + entId);
				});
				
				socket.on("connect_failed", function() {
					qn.log("socket.io连接建立失败");
				});
				
				socket.on("data", function(data) {
					qn.log("socket.io onmessage : " + data);
				});
				
				socket.on("event", function(data) {
					qn.log("socket.io event : " + data);
					var status;
					if (data == "坐席振铃") {
						status = qn.agentStatus.AGENT_ALERTING;
					} else if (data == "坐席接通") {
						status = qn.agentStatus.AGENT_CONNECTED;
						
						// 坐席接通时间作为通话开始时间
						if (qn.currentCall) {
							qn.currentCall.startTime = qn.formatDate(new Date());
						} else {
							qn.log("当前通话为空，不存储开始时间");
						}
					} else if (data == "客户接通") {
						status = qn.agentStatus.CONNECTED;
						// 开始计时
						qn.viewModelObj.startTimer();
					} else if (data == "通话挂断") {
						qn.tip("已挂断");
						status = qn.agentStatus.BUSY;
						// 停止计时
						qn.viewModelObj.stopTimer();
						// 挂断事件后处理通话结束
						qn.handleCallFinish();
					} else if (data == "咨询接通") {
						status = qn.agentStatus.CONSULTED;
					} else if (data == "被咨询接通") {
						status = qn.agentStatus.CONSULTED_B;
					} else if (data == "会议接通") {
						status = qn.agentStatus.CONFERENCED;
					} else if (data == "监听接通") {
						status = qn.agentStatus.OBSERVED;
					}
					qn.viewModelObj.currentStatus(status);
				});
				
				socket.on("disconnect", function() {
					qn.log("socket.io连接已关闭");
				});
				
				qn.socket = socket;
			} else {
				qn.error("io 未定义");
			}
		},
		
		socket : null,
		
		// 对外扩展接口
		extend : {
			login : function() {},
			logout : function() {},
			call : function() {},
			setBusy : function() {},
			setReady : function() {},
			hangup : function() {},
			reset : function() {},
			show : function() {},
			hide : function() {},

			notifyEventHandler : function() {}
		},

		// Knockout视图模型
		viewModel : function() {
			var _this = this;
			
			this.visible = ko.observable(false);
			
			this.logined = ko.observable(false);
			this.loginMessage = ko.observable("");
			
			this.entId = ko.observable(qnConfig.entId);
			this.agentId = ko.observable($.cookie("agentId") ? $.cookie("agentId") : "");
			this.agentNumber = ko.observable($.cookie("agentNumber") ? $.cookie("agentNumber") : "");
			this.autoSetBusy = ko.observable(true);
			
			// 坐席角色（1普通坐席,2班长坐席,3无终端坐席）
			this.agentRole = ko.observable(1);
			
			this.outCallNumber = ko.observable("");
			
			this.show = function() {
				if (!_this.visible()) {
					$("#qn").css("width", "0px");
					_this.visible(true);
					$("#qn").animate({width : "330px"});
				}
			},
			
			this.hide = function() {
				if (_this.visible()) {
					$("#qn").animate({width : "0px"}, function() {
						qn.viewModelObj.visible(false);
					});
				}
			},
			
			qn.extend.show = this.show;
			qn.extend.hide = this.hide;
			
			/**
			 * 登录
			 */
			this.login = function() {
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				qn.log("login fromYD = " + fromYD);
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				} else {
					if (_this.agentId() == "") {
						_this.loginMessage("用户名必填");
						return;
					}
					if (_this.agentNumber() == "") {
						_this.loginMessage("分机号必填");
						return;
					}
				}
				
				_this.loginMessage("");
				$.ajax({
					url : qn.config.ccodServer + "/login?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId(),
						number : "tel:" + (param.agentNumber || _this.agentNumber()),
						agentstate : _this.autoSetBusy() ? 3 : 1
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.logined(true);
							_this.loginMessage("");
							_this.outCallNumber("");
							_this.callDuration(0);
							_this.agentRole(data.rows.agentRole || 1);
							qn.connectNodeServer(_this.agentId(), _this.entId());
							
							var agentState = data.rows.autostate;
							if (agentState == 1) {
								_this.currentStatus(qn.agentStatus.READY);
							} else if (agentState == 3) {
								_this.currentStatus(qn.agentStatus.BUSY);
							}
							
							qn.tip("登录成功", "success");
							
							// 用户名分机存储到cookie
							$.cookie("agentId", _this.agentId(), {expires: 7});
							$.cookie("agentNumber", _this.agentNumber(), {expires: 7});
							
						} else {
							qn.log("data.result=" + data.result);
							_this.loginMessage(data.msg);
						}
					},
					error : function() {
						_this.loginMessage("登录异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			qn.extend.login = this.login;
			
			/**
			 * 登出
			 */
			this.logout = function() {
				if (!_this.logoutEnabled()) {
					return -1;
				}
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				qn.log("logout fromYD = " + fromYD);
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/logout?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.logined(false);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("登出失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("登出异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			qn.extend.logout = this.logout;
			
			this.timerId = ko.observable(null);
			
			this.startTimer = function() {
				if (!this.timerId()) {
					this.callBeginTime(new Date().getTime());
					this.callDuration(0);
					this.timerId(setInterval(this.timerCount, 1000));
				} else {
					qn.log("timerId不为空，不执行startTimer");
				}
			};
			
			this.stopTimer = function() {
				if (this.timerId()) {
					clearInterval(this.timerId());
					this.timerId(null);
				} else {
					qn.log("timerId为空，不执行stopTimer");
				}
			};
			
			this.timerCount = function() {
				var nowDate = new Date().getTime();
				var seconds = parseInt((nowDate - _this.callBeginTime()) / 1000);
				_this.callDuration(seconds);
			};
			
			this.callBeginTime = ko.observable(new Date().getTime());
			this.callDuration = ko.observable(0);
			
			this.callDurationShow = ko.computed(function() {
				var diff = this.callDuration();
				var hour = parseInt(diff / 3600);
				if (hour < 10) {
					hour = "0" + hour;
				}
				var minute = parseInt((diff - hour * 3600) / 60);
				if (minute < 10) {
					minute = "0" + minute;
				}
				var second = parseInt(diff - hour * 3600 - minute * 60);
				if (second < 10) {
					second = "0" + second;
				}
				
				return hour + ":" + minute + ":" + second;
			}, this);
			
			this.currentStatus = ko.observable(qn.agentStatus.BUSY);
			
			this.callEnabled = ko.computed(function() {
				// 集成环境下，外呼按钮不可用
				if (qnConfig.integrated) {
					return false;
				}
				return (this.currentStatus() == qn.agentStatus.BUSY);
			}, this);
			
			/**
			 * 挂断：坐席接通、双方通话、保持、会议中、监听、被咨询中中可用
			 */
			this.hangupEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.AGENT_CONNECTED || 
						this.currentStatus() == qn.agentStatus.CONNECTED ||
						this.currentStatus() == qn.agentStatus.HOLD ||
						this.currentStatus() == qn.agentStatus.CONFERENCED ||
						this.currentStatus() == qn.agentStatus.OBSERVED || 
						this.currentStatus() == qn.agentStatus.CONSULTED_B
						);
			}, this);
			
			/**
			 * 置闲：置忙时可用
			 */
			this.readyEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.BUSY);
			}, this);
			
			/**
			 * 置忙：就绪时可用
			 */
			this.busyEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.READY);
			}, this);
			
			/**
			 * 登出：置忙，置闲，正在呼叫时可用
			 */
			this.logoutEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.BUSY) ||
					(this.currentStatus() == qn.agentStatus.READY) || 
					(this.currentStatus() == qn.agentStatus.CONNECTING);
			}, this);
			
			/**
			 * 重置：目前一直可用
			 */
			this.resetEnabled = ko.observable(true);
			
			/**
			 * 保持：双方通话时可用
			 */
			this.holdEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.CONNECTED);
			}, this);
			
			/**
			 * 保持接回：保持时可用
			 */
			this.holdReturnEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.HOLD);
			}, this);
			
			/**
			 * 咨询：双方通话时可用
			 */
			this.consultEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.CONNECTED);
			}, this);
			
			/**
			 * 咨询接回：咨询通话时可用
			 */
			this.consultReturnEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.CONSULTED);
			}, this);
			
			/**
			 * 会议：咨询通话时可用
			 */
			this.conferenceEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.CONSULTED);
			}, this);
			
			/**
			 * 转移：咨询通话时可用
			 */
			this.transferEnabled = ko.computed(function() {
				return (this.currentStatus() == qn.agentStatus.CONSULTED);
			}, this);
			
			/**
			 * 监听：班长坐席置忙时可用
			 */
			this.observeEnabled = ko.computed(function() {
				return (this.agentRole() == 2 && this.currentStatus() == qn.agentStatus.BUSY);
			}, this);
			
			/**
			 * 强插：班长坐席监听中可用
			 */
			this.insertEnabled = ko.computed(function() {
				return (this.agentRole() == 2 && this.currentStatus() == qn.agentStatus.OBSERVED);
			}, this);
			
			/**
			 * 强拆：班长坐席监听中可用
			 */
			this.abortEnabled = ko.computed(function() {
				return (this.agentRole() == 2 && this.currentStatus() == qn.agentStatus.OBSERVED);
				//return (this.currentStatus() == qn.agentStatus.OBSERVED);
			}, this);

			/**
			 * 通知话路事件处理器
			 */
			this.callEventComing = ko.computed(function() {
				var status = qn.agentStatusConvert[this.currentStatus()];
				var data = {};
				data.agentId = this.agentId();
				qn.extend.notifyEventHandler(status, data);
				return true;
			},this);

			/**
			 * 通知登录事件处理器
			 */
			this.loginEventComing = ko.computed(function() {
				var status = "";
				var data = {};
				if (this.logined()) {
					status = qn.agentStatusConvert.登录;
					data.agentId = this.agentId();
					data.agentNumber = this.agentNumber();
				} else {
					status = qn.agentStatusConvert.登出;
				}
				qn.extend.notifyEventHandler(status,data);
				return;
			},this).extend({notify:'always'});


			
			/**
			 * 置忙
			 */
			this.setBusy = function() {
				
				if (!_this.busyEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/agentReady?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId(),
						state : 3
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.BUSY);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("置忙失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("置忙异常，请联系相关技术人员");
					}
				});
				return 0;
				
			};
			
			qn.extend.setBusy = this.setBusy;
			
			/**
			 * 置闲
			 */
			this.setReady = function() {
				
				if (!_this.readyEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/agentReady?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId(),
						state : 1
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.READY);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("置闲失败！" + data.msg);
						}
						
						qn.viewModelObj.stopTimer();
					},
					error : function() {
						qn.tip("置闲异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			qn.extend.setReady = this.setReady;
			
			/**
			 * 外呼
			 */
			this.setCall = function() {
				if (!qnConfig.integrated) {
					if (!_this.callEnabled()) {
						return -1;
					}
				} else {
					// 集成环境下，如果未登录，则弹出登录界面
					if (!_this.logined()) {
						_this.show();
						qn.log("用户未登录，弹出登录界面");
						return -2;
					}
					// 再判断当前状态是否为置忙
					if (_this.currentStatus() != qn.agentStatus.BUSY) {
						qn.log("当前状态不允许外呼");
						return -3;
					}
				}
				
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				// 集成环境下，手动点击外呼将被禁止
				if (qnConfig.integrated && !fromYD) {
					qn.log("外呼操作被禁止");
					return;
				}
				
				var toNumber = param.number || _this.outCallNumber();
				if ($.trim(toNumber) == "") {
					qn.log("呼出号码不能为空");
					return -1;
				}
				
				_this.callDuration(0);
				_this.stopTimer();
				
				// 集成环境下，将传入的号码展示到号码框
				if (qnConfig.integrated) {
					_this.outCallNumber(toNumber);
				}
				
				var date = new Date();
				var hours = date.getHours();
				if (hours < 10) {
					hours = "0" + hours;
				}
				
				var minutes = date.getMinutes();
				if (minutes < 10) {
					minutes = "0" + minutes;
				}
				
				var seconds = date.getSeconds();
				if (seconds < 10) {
					seconds = "0" + seconds;
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/outbound?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : _this.entId(),
						agentid : _this.agentId(),
						to : toNumber
					},
					success : function(data) {
						/*callback &&	callback({
							code : data.result,
							message : data.msg,
							callId : data.rows.callid
						});*/
						
						if (data.result == 0) {		// 外呼成功
							_this.currentStatus(qn.agentStatus.CONNECTING);
							// 设置当前通话
							qn.currentCall = {
								code : data.result,
								message : data.msg,
								callId : data.rows.callid,
								startTime : null,
								endTime : null,
								callback : callback
							};
							qn.addCallNumber({
								number : toNumber,
								time : hours + ":" + minutes + ":" + seconds
							});
						} else {		// 外呼失败
							qn.log("data.result=" + data.result);
							qn.tip("外呼失败！" + data.msg);
							callback &&	callback({
								code : data.result,
								message : data.msg
							});
						}
					},
					error : function() {
						qn.tip("外呼异常，请联系相关技术人员");
					}
				});
				return 0;
				
			};
			
			qn.extend.call = this.setCall;
			
			/**
			 * 挂断
			 */
			this.setHangup = function() {
				
				if (!_this.hangupEnabled()) {
					return -1;
				}

				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/hangupCall?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.BUSY);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("挂断失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("挂断异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			qn.extend.hangup = this.setHangup;
			
			/**
			 * 重置
			 * 重置后立即变为置忙（置忙或置闲看autoSetBusy值）
			 */
			this.reset = function() {
				if (!_this.resetEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/reset?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId(),
						state : 3
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.BUSY);
							qn.tip("重置成功", "success");
							
							// 重置成功后处理通话结束
							qn.handleCallFinish();
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("重置失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("重置异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			qn.extend.reset = this.reset;
			
			/**
			 * 保持
			 * 保持成功后，立即变为保持状态
			 */
			this.hold = function() {
				if (!_this.holdEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/hold?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {

							_this.currentStatus(qn.agentStatus.HOLD);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("保持失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("保持异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 保持接回
			 * 保持接回成功后，坐席立即变成双方通话状态
			 */
			this.holdReturn = function() {
				if (!_this.holdReturnEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/retrieve?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.CONNECTED);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("保持接回失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("保持接回异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 咨询
			 * 咨询请求后，原坐席变为正在咨询状态，与目标坐席都等待咨询振铃事件
			 */
			this.consult = function() {
				if (!_this.consultEnabled()) {
					return -1;
				}
				
				var consultNumber = prompt("输入要咨询的坐席工号：");
				if (!consultNumber) {
					return 0;
				}
				qn.log("要咨询的坐席工号：" + consultNumber);
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/consult?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId(),
						desttype : param.destType || 1, //(0外线，1内线，暂不支持外线)
						destnumber : param.destNumber || consultNumber
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.CONSULTING);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("咨询失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("咨询异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 咨询接回
			 * 咨询接回成功后，原坐席变为双方通话，目标坐席等待挂断事件
			 */
			this.consultReturn = function() {
				if (!_this.consultReturnEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/consultretrieve?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.CONNECTED);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("咨询接回失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("咨询接回异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 会议
			 * 会议发起后，原坐席和目标坐席均等待会议事件
			 */
			this.conference = function() {
				if (!_this.conferenceEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/conference?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.CONFERENCING);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("会议失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("会议异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 转移
			 * 转移成功后，原坐席挂断，变为置忙；目标坐席等待双方通话事件
			 */
			this.transfer = function() {
				if (!_this.transferEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/transfer?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.BUSY);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("转移失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("转移异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 监听
			 * 监听请求后，变为正在监听状态，等待监听接通事件
			 */
			this.observe = function() {
				if (!_this.observeEnabled()) {
					return -1;
				}
				
				var destAgentId = prompt("请输入要监听的坐席工号：");
				if (!destAgentId) {
					return;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/monitor?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId(),
						destagentid : param.destAgentId || destAgentId
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.OBSERVING);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("监听失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("监听异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 强插
			 * 强插请求后，变为正在强插状态，等待强插成功（即会议中）事件
			 */
			this.forceInsert = function() {
				if (!_this.insertEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/intrude?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.INSERTING);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("强插失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("强插异常，请联系相关技术人员");
					}
				});
				return 0;
			};
			
			/**
			 * 强拆
			 * 强拆后，班长坐席变为正在强拆，等待双方通话事件，目标坐席等待挂断事件
			 */
			this.forceAbort = function() {
				if (!_this.abortEnabled()) {
					return -1;
				}
				
				qn.log(arguments);
				var fromYD = (arguments.length == 1) || (arguments.length == 2 && typeof arguments[1] == "function");
				var param = {}, callback = null;
				if (fromYD) {
					param = arguments[0];
					callback = arguments[1];
				}
				
				$.ajax({
					url : qn.config.ccodServer + "/teardown?callback=?",
					type : "get",
					dataType : "jsonp",
					cache : false,
					data : {
						appid : param.entId || _this.entId(),
						agentid : param.agentId || _this.agentId()
					},
					success : function(data) {
						callback &&	callback({
							code : data.result,
							message : data.msg
						});
						
						if (data.result == 0) {
							_this.currentStatus(qn.agentStatus.ABORTING);
						} else {
							qn.log("data.result=" + data.result);
							qn.tip("强拆失败！" + data.msg);
						}
					},
					error : function() {
						qn.tip("强拆异常，请联系相关技术人员");
					}
				});
				return 0;
			};
		},
		
		// 视图模型实例
		viewModelObj : null,
		
		// Knockout应用视图模型
		applyBindings : function(object) {
			if (window.ko) {
				this.viewModelObj = new this.viewModel();
				ko.applyBindings(this.viewModelObj, object);
				this.log("applyBindings 完毕");
			} else {
				this.error("ko 未定义");
			}
		},
		
		// 当前时刻的通话
		currentCall : null,
		
		loadJQuery : function(callback) {
			this.log("开始加载jQuery...");
			var jquery = document.createElement("script");
			jquery.src = this.config.jQuery;
			
			if (jquery.onload === null) {
				jquery.onload = function() {
					qn.log("jQuery 加载完毕");
					callback && callback();
				};
			} else {
				jquery.onreadystatechange = function() {
					qn.log("jquery state : " + this.readyState);
					if (this.readyState == "loaded" || this.readyState == "complete") {
						qn.log("jQuery 加载完毕 (orsc)");
						callback && callback();
					}
				}
			}
			document.getElementsByTagName("head")[0].appendChild(jquery);
		},
		
		loadKnockout : function(callback) {
			this.log("开始加载knockout...");
			var knockout = document.createElement("script");
			knockout.src = this.config.knockout;
			
			if (knockout.onload === null) {
				knockout.onload = function() {
					qn.log("knockoutJs 加载完毕");
					callback && callback();
				};
			} else {
				knockout.onreadystatechange = function() {
					qn.log("knockout state : " + this.readyState);
					if (this.readyState == "loaded" || this.readyState == "complete") {
						qn.log("knockoutJs 加载完毕 (orsc)");
						callback && callback();
					}
				}
			};
			
			document.getElementsByTagName("head")[0].appendChild(knockout);
		},
		
		loadSocketIO : function(callback) {
			this.log("开始加载socket.io...");
			var socketio = document.createElement("script");
			socketio.src = this.config.nodeServer + "/socket.io/socket.io.js";
			
			if (socketio.onload === null) {
				socketio.onload = function() {
					qn.log("socket.io.js 加载完毕");
					callback && callback();
				};
			} else {
				socketio.onreadystatechange = function() {
					qn.log("socket.io state : " + this.readyState);
					if (this.readyState == "loaded" || this.readyState == "complete") {
						qn.log("socket.io 加载完毕 (orsc)");
						callback && callback();
					}
				}
			}
			
			document.getElementsByTagName("head")[0].appendChild(socketio);
		},
		
		loadStyle : function() {
			this.log("开始加载css...");
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = this.config.style;
			link.onload = function() {
				qn.log("css 加载完毕");
			};
			document.getElementsByTagName("head")[0].appendChild(link);
		},
		
		loadAutoCompleteStyle : function() {
			this.log("开始加载autocomplete css...");
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = this.config.autoCompleteStyle;
			link.onload = function() {
				qn.log("autocomplete css 加载完毕");
			};
			document.getElementsByTagName("head")[0].appendChild(link);
		},
		
		loadAutoCompleteScript : function(callback) {
			this.log("开始加载autocomplete...");
			var autoComplete = document.createElement("script");
			autoComplete.src = this.config.autoComplete;
			
			if (autoComplete.onload === null) {
				autoComplete.onload = function() {
					qn.log("autocomplete.js 加载完毕");
					callback && callback();
				};
			} else {
				autoComplete.onreadystatechange = function() {
					qn.log("autocomplete state : " + this.readyState);
					if (this.readyState == "loaded" || this.readyState == "complete") {
						qn.log("autocomplete 加载完毕 (orsc)");
						callback && callback();
					}
				}
			}
			
			document.getElementsByTagName("head")[0].appendChild(autoComplete);
		},
		
		loadJqueryCookie : function(callback) {
			this.log("开始加载jquery cookie...");
			var jqueryCookie = document.createElement("script");
			jqueryCookie.src = this.config.jqueryCookie;
			
			if (jqueryCookie.onload === null) {
				jqueryCookie.onload = function() {
					qn.log("jquery.cookie.js 加载完毕");
					callback && callback();
				};
			} else {
				jqueryCookie.onreadystatechange = function() {
					qn.log("jquery cookie state : " + this.readyState);
					if (this.readyState == "loaded" || this.readyState == "complete") {
						qn.log("jquery cookie 加载完毕 (orsc)");
						callback && callback();
					}
				}
			}
			
			document.getElementsByTagName("head")[0].appendChild(jqueryCookie);
		},
		
		loadJson : function(callback) {
			this.log("开始加载json...");
			var json = document.createElement("script");
			json.src = this.config.json;
			
			if (json.onload === null) {
				json.onload = function() {
					qn.log("json.js 加载完毕");
					callback && callback();
				};
			} else {
				json.onreadystatechange = function() {
					qn.log("json state : " + this.readyState);
					if (this.readyState == "loaded" || this.readyState == "complete") {
						qn.log("json 加载完毕 (orsc)");
						callback && callback();
					}
				}
			}
			
			document.getElementsByTagName("head")[0].appendChild(json);
		},
		
		loadDom : function() {
			
			this.log("开始加载DOM...");
			var html = "";
			html += ("<div id=\"qn\" class=\"qn\" data-bind=\"visible: visible()\" style=\"display:none;\">");
			html += ("	<div class=\"qn-login\" data-bind=\"visible: !logined()\">");
			html += ("		<div class=\"qn-login-main\">");
			html += ("			<div class=\"qn-logo-all\"></div>");
			html += ("			<p align=\"center\" style=\"margin-top:20px;\">");
			html += ("				用户名：<input type=\"text\" class=\"qn-input\" data-bind=\"value: agentId\" maxlength=\"15\" />");
			html += ("			</p>");
			html += ("			<p align=\"center\">");
			html += ("				分机号：<input type=\"text\" class=\"qn-input\" data-bind=\"value: agentNumber\" maxlength=\"15\" />");
			html += ("			</p>");
			html += ("			<p align=\"center\">");
			html += ("				<button type=\"button\" class=\"qn-login-button\" data-bind=\"click: login\">登录</button>");
			html += ("			</p>");
			html += ("			<p align=\"center\">");
			html += ("				<span class=\"qn-message-span\" data-bind=\"text: loginMessage\"></span>");
			html += ("			</p>");
			html += ("		</div>");
			html += ("	</div>");
			html += ("	<div class=\"qn-main\" data-bind=\"visible: logined()\">");
			html += ("		<div class=\"qn-tip\" id=\"qn_tip\"></div>");
			html += ("		<div class=\"qn-top\">");
			html += ("			<table class=\"qn-top-table\">");
			html += ("				<tbody>");
			html += ("					<tr>");
			html += ("						<td><span data-bind=\"text: agentId\"></span><br />");
			html += ("						<span data-bind=\"text: currentStatus\"></span></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: setReady\">");
			html += ("								<div class=\"qn-button-img-thin\"");
			html += ("									data-bind=\"css: {\'qn-button-ready\' : readyEnabled(), \'qn-button-ready-disable\' : !readyEnabled()}\"></div>");
			html += ("								置闲");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: setBusy\">");
			html += ("								<div class=\"qn-button-img-thin\"");
			html += ("									data-bind=\"css: {\'qn-button-busy\' : busyEnabled(), \'qn-button-busy-disable\' : !busyEnabled()}\"></div>");
			html += ("								置忙");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: logout\">");
			html += ("								<div class=\"qn-button-img-thin\"");
			html += ("									data-bind=\"css: {\'qn-button-logout\' : logoutEnabled(), \'qn-button-logout-disable\' : !logoutEnabled()}\"></div>");
			html += ("								登出");
			html += ("							</div></td>");
			html += ("						<td><span class=\"qn-bold-text\" data-bind=\"text: callDurationShow\"></span></td>");
			html += ("					</tr>");
			html += ("				</tbody>");
			html += ("			</table>");
			html += ("		</div>");
			html += ("		<div class=\"qn-middle\">");
			html += ("			<p style=\"margin:5px; *margin:2px;\">");
			html += ("				<span class=\"qn-text-span\">呼叫号码：</span><input id=\"outCallNumberInput\" type=\"text\" maxlength=\"15\" class=\"qn-number-input\" data-bind=\"value: outCallNumber\"/>");
			html += ("			</p>");
			html += ("			<p style=\"margin:5px; *margin:2px;\">");
			html += ("				<span class=\"qn-text-span\">外显号码：</span><span class=\"qn-select-background\"><span class=\"qn-select-border\"><select class=\"qn-select\"><option data-bind='text: agentNumber'></option></select></span></span>");
			html += ("			</p>");
			html += ("		</div>");
			html += ("");
			html += ("		<div class=\"qn-command\">");
			html += ("			<table class=\"qn-command-table\">");
			html += ("				<tbody>");
			html += ("					<tr>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: setCall\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-call\' : callEnabled(), \'qn-button-call-disable\' : !callEnabled()}\"></div>");
			html += ("								呼叫");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: setHangup\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-hangup\' : hangupEnabled(), \'qn-button-hangup-disable\' : !hangupEnabled()}\"></div>");
			html += ("								挂断");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: hold\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-keep\' : holdEnabled(), \'qn-button-keep-disable\' : !holdEnabled()}\"></div>");
			html += ("								保持");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: holdReturn\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-keep-return\' : holdReturnEnabled(), \'qn-button-keep-return-disable\' : !holdReturnEnabled()}\"></div>");
			html += ("								保持接回");
			//html += ("								<div class=\"qn-button-img qn-button-ivr-disable\"></div>");
			//html += ("								转IVR");
			html += ("							</div></td>");
			html += ("					</tr>");
			html += ("					<tr>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: transfer\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-transfer\' : transferEnabled(), \'qn-button-transfer-disable\' : !transferEnabled()}\"></div>");
			html += ("								转移");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: consult\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-consult\' : consultEnabled(), \'qn-button-consult-disable\' : !consultEnabled()}\"></div>");
			html += ("								咨询");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: consultReturn\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-consult-return\' : consultReturnEnabled(), \'qn-button-consult-return-disable\' : !consultReturnEnabled()}\"></div>");
			html += ("								咨询接回");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: conference\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-meeting\' : conferenceEnabled(), \'qn-button-meeting-disable\' : !conferenceEnabled()}\"></div>");
			html += ("								会议");
			html += ("							</div></td>");
			html += ("					</tr>");
			html += ("					<tr>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: observe\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-observe\' : observeEnabled(), \'qn-button-observe-disable\' : !observeEnabled()}\"></div>");
			html += ("								监听");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: forceInsert\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-force-insert\' : insertEnabled(), \'qn-button-force-insert-disable\' : !insertEnabled()}\"></div>");
			html += ("								强插");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: forceAbort\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-force-abort\' : abortEnabled(), \'qn-button-force-abort-disable\' : !abortEnabled()}\"></div>");
			html += ("								强拆");
			html += ("							</div></td>");
			html += ("						<td><div class=\"qn-button\" data-bind=\"click: reset\">");
			html += ("								<div class=\"qn-button-img\"");
			html += ("									data-bind=\"css: {\'qn-button-reset\' : resetEnabled(), \'qn-button-reset-disable\' : !resetEnabled()}\"></div>");
			html += ("								重置");
			html += ("							</div></td>");
			html += ("					</tr>");
			html += ("				</tbody>");
			html += ("			</table>");
			html += ("		</div>");
			html += ("	</div>");
			html += ("</div>");
			html += ("<div id=\"qn_icon\" class=\"qn-icon\"></div>");
			
			$(document.body).append(html);
			this.log("DOM 加载完毕");
		},
		
		readyOnload : function() {
			
			this.loadDom();
			this.bindEvents();
			
			this.loadJqueryCookie(function() {
				qn.loadAutoCompleteScript(function() {
					qn.initAutoComplete();
					qn.applyBindings(document.getElementById("qn"));
				});
			});
		},
		
		autoComplete : null,
		
		initAutoComplete : function() {
			this.autoComplete = new qnac("outCallNumberInput", 
				[{field:"number", title:"号码"}, {field:"time", title:"时间"}]
			, 200, function(value) {
				qn.viewModelObj.outCallNumber(value);
			}, "number");
			
			if ($.cookie("recentNumberArr")) {
				var recentNumberArr = JSON.parse($.cookie("recentNumberArr"));
				this.autoComplete.setData(recentNumberArr);
				this.callNumberHistory = recentNumberArr;
			}
		},
		
		callNumberHistory : [],
		
		addCallNumber : function(number) {
			this.callNumberHistory.unshift(number);
			var recentNumberArr = this.callNumberHistory.slice(0, 8);
			this.autoComplete.setData(recentNumberArr);
			// 存储到cookie
			var recentNumberArrStr = JSON.stringify(recentNumberArr);
			$.cookie("recentNumberArr", recentNumberArrStr, {expires: 7});
		},
		
		handleCallFinish : function() {
			// 通话挂断（或重置成功）的时间作为通话结束时间
			if (qn.currentCall) {
				qn.currentCall.endTime = qn.formatDate(new Date());
				// 挂断事件（或重置）到来时，若开始时间为空，则认为是失败的呼叫（如坐席未振铃，或坐席振铃挂断）
				if (!qn.currentCall.startTime) {
					qn.currentCall.startTime = qn.currentCall.endTime;
					qn.currentCall.code = 1;
					qn.currentCall.message = "通话异常结束";
				}
				
				// 执行回调
				var call = qn.currentCall;
				qn.currentCall.callback && qn.currentCall.callback({
					code : call.code,
					message : call.message,
					callId : call.callId,
					startTime : call.startTime,
					endTime : call.endTime
				});
			} else {
				qn.log("当前通话为空，不存储结束时间");
			}
			
			// 完成通话，清空当前通话
			qn.currentCall = null;
		},
		
		// 格式化日期时间
		formatDate : function(date, format) {
			if (!format) {
				format = "yyyy-MM-dd hh:mm:ss";
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
		},
		
		tip : function(msg, level) {
			var $tip = $("#qn_tip");
			if (level == "success") {
				if (!$tip.hasClass("qn-tip-success")) {
					$tip.addClass("qn-tip-success");
				}
			} else {
				$tip.removeClass("qn-tip-success");
			}
			$tip.text(msg).fadeIn(500);
			setTimeout(function() {
				$tip.fadeOut(500);
			}, 2000);
		}
	};
	
	window.qn = qn;
})();

qn.loadStyle();
qn.loadAutoCompleteStyle();
qn.loadKnockout();
qn.loadSocketIO();

if (!window.JSON) {
	qn.loadJson();
}

if (!window.$) {
	
	// 引入jQuery库
	qn.loadJQuery(function() {
		$(function() {
			setTimeout(function() {qn.readyOnload(); }, 500);
		});
	});
	
	
} else {
	$(function() {
		setTimeout(function() {qn.readyOnload(); }, 1000);
	});
}
