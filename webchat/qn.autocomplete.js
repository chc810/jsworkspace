/**
 * Simple AutoComplete Plugin
 * Channelsoft
 */
(function() {
	
	var qnac = function(id, columns, showTimeout, onselect, valueField) {
		
		this.input = document.getElementById(id);
		//this.dataArr = dataArr;
		this.columns = columns;
		this.selectId = id + "_select";
		this.tableId = id + "_table";
		this.buildSelect();
		this.bindEvent();
		this.showTimeout = showTimeout || 0;
		this.onselect = onselect;
		this.valueField = valueField;
		return this;
	};
	
	qnac.prototype.buildSelect = function() {
		
		var _this = this;
		
		var div = "<div id='" + this.selectId + "' class='qnac-select'></div>";
		$(document.body).append(div);
		// 设置div的位置
		$("#" + this.selectId).css({
			"left" : $(this.input).offset().left,
			"top" : $(this.input).offset().top + $(this.input).height(),
			"width" : $(this.input).outerWidth()
		});
		
		// 绘制table
		var table = "<table id='" + this.tableId + "' class='qnac-table'><thead></thead><tbody></tbody><table>";
		$("#" + this.selectId).append(table);
		
		// 绘制thead
		var theadHtml = "<tr>";
		for (var i = 0; i < this.columns.length; i++) {
			theadHtml += "<th>" + this.columns[i].title + "</th>";
		}
		theadHtml += "</tr>";
		
		$("#" + this.tableId + " thead").append(theadHtml);
		
		$("#" + this.tableId + " tbody").delegate("tr", "mousedown", function() {
			var value;
			if (!_this.valueField) {
				value = $(this).text();
			} else {
				var rowId = parseInt($(this).attr("rowId"));
				value = _this.dataArr[rowId][_this.valueField];
			}
			_this.input.value = value;
			
			if (_this.onselect && typeof _this.onselect == "function") {
				_this.onselect(value);
			}
			
		});
	};
	
	qnac.prototype.bindEvent = function() {
		var _this = this;
		$(this.input).bind("focus", function() {
			$("#" + _this.selectId).css({
				"left" : $(_this.input).offset().left,
				"top" : $(_this.input).offset().top + $(_this.input).height()
			});
			setTimeout(function() {
				$("#" + _this.selectId).show();
			}, _this.showTimeout);
		});
		$(this.input).bind("blur", function() {
			$("#" + _this.selectId).hide();
		});
	};
	
	/**
	 * 设置数据
	 */
	qnac.prototype.setData = function(dataArr) {
		this.dataArr = dataArr;
		var tbodyHtml = "";
		for (var i = 0; i < this.dataArr.length; i++) {
			tbodyHtml += "<tr rowId='" + i + "'>";
			for (var col = 0; col < this.columns.length; col++) {
				tbodyHtml += "<td>" + this.dataArr[i][this.columns[col].field] + "</td>";
			}
			tbodyHtml += "</tr>";
		}
		$("#" + this.tableId + " tbody").html(tbodyHtml);
	};
	
	window.qnac = qnac;
})();