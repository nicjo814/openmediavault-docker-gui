Ext.define("OMV.module.admin.service.docker.EnvVarRow", {
	extend: "Ext.container.Container",
	alias: "widget.module.admin.service.docker.envvarrow",

	layout: "hbox",
	shadow: false,
	border: false,
	defaultType: "container",
	nameVal: "",
	valueVal: "",
	defaultVal: "false",

	initComponent: function() {
		var me = this;
		var defVal;
		if(me.defaultVal === "true") {
			defVal = true;
		} else {
			defVal = false;
		}

		me.items = [{
			xtype: "textfield",
			name: "envName-" + me.envCount,
			id: "envName-" + me.envCount,
			value: me.nameVal,
			flex: 1,
			readOnly: defVal
		},{
			xtype: "textfield",
			name: "envValue-" + me.envCount,
			id: "envValue-" + me.envCount,
			value: me.valueVal,
			flex: 2,
			readOnly: defVal
		},{
			xtype: "button",
			id: "envVarAddButton-" + me.envCount,
			icon: "images/add.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			hidden: defVal,
			listeners: {
				scope: this,
				click: function(button, e , eOpts) {
					var errorMsg = me.validateData();
					if(errorMsg === "") {
						me.up('window').envVars[me.envCount] = {
							name: me.queryById("envName-" + me.envCount).getValue(),
							value: me.queryById("envValue-" + me.envCount).getValue()
						};
						var nextCount = parseInt(me.envCount)+1;
						button.setHidden(true);
						me.queryById("envVarDelButton-" + me.envCount).setHidden(false);
						var newRow = Ext.create("OMV.module.admin.service.docker.EnvVarRow", {
							envCount: nextCount,
							id: "envVarRow-" + nextCount
						});
						Ext.getCmp("dockerEnvVars").add(newRow);
						me.queryById("envName-" + me.envCount).setReadOnly(true);
						me.queryById("envValue-" + me.envCount).setReadOnly(true);
					} else {
						Ext.Msg.alert("Bad input", errorMsg);
					}
				},
				setNewRow: function() {
					var me = this;
					if(me.defVal) {
						me.up('window').envVars[me.envCount] = {
							name: me.nameVal,
							value: me.valueVal
						};
					}
					me.queryById("envVarAddButton-" + me.envCount).setHidden(true);
					me.queryById("envVarDelButton-" + me.envCount).setHidden(false);
					me.queryById("envVarDelButton-" + me.envCount).setDisabled(defVal);
					me.queryById("envName-" + me.envCount).setReadOnly(true);
					me.queryById("envValue-" + me.envCount).setReadOnly(true);
					me.up('window').envCount = me.envCount+1;
				}
			}
		},{
			xtype: "button",
			id: "envVarDelButton-" + me.envCount,
			icon: "images/delete.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			hidden: !defVal,
			disabled: defVal,
			listeners: {
				scope: me,
				click: function(button, e , eOpts) {
					delete me.up('window').envVars[me.envCount];
					Ext.getCmp("dockerEnvVars").remove("envVarRow-" + me.envCount);
				}
			}
		},{
			xtype: "hiddenfield",
			name: "envVarDefault-" + me.envCount,
			id: "envVarDefault-" + me.envCount,
			value: me.defaultVal
		}];
		Ext.apply(me, {
		});
		me.callParent(arguments);
	},

	validateData: function() {
		var me = this;
		var name = me.queryById("envName-" + me.envCount).getValue();
		var errorMsg = "";
		if (!(/^[a-zA-Z_]+[a-zA-Z0-9_]*$/.test(name))) {
			errorMsg = errorMsg + "Invalid name supplied";
		}
		return errorMsg;
	}
});
