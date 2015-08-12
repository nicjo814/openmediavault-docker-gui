Ext.define("OMV.module.admin.service.docker.EnvVarRow", {
	extend: "Ext.container.Container",

	layout: "hbox",
	shadow: false,
	border: false,
	defaultType: "container",

	initComponent: function() {
		var me = this;
		me.items = [{
			xtype: "textfield",
			name: "envName-" + me.envCount,
			id: "envName-" + me.envCount,
			flex: 1
		},{
			xtype: "textfield",
			name: "envValue-" + me.envCount,
			id: "envValue-" + me.envCount,
			flex: 2
		},{
			xtype: "button",
			id: "envVarAddButton-" + me.envCount,
			icon: "images/add.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			listeners: {
				click: function(button, e , eOpts) {
					var errorMsg = me.validateData();
					if(errorMsg === "") {
						var nextCount = parseInt(me.envCount)+1;
						button.setHidden(true);
						Ext.getCmp("envVarDelButton-" + me.envCount).setHidden(false);
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
				}	
			}
		},{
			xtype: "button",
			id: "envVarDelButton-" + me.envCount,
			icon: "images/delete.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			hidden: true,
			listeners: {
				click: function(button, e , eOpts) {
					Ext.getCmp("dockerEnvVars").remove("envVarRow-" + me.envCount);
				}
			}
		},{
			xtype: "hiddenfield",
			name: "envVarDefault-" + me.envCount,
			id: "envVarDefault-" + me.envCount,
			value: "false"
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
