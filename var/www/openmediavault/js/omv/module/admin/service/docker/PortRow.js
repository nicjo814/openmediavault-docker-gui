Ext.define("OMV.module.admin.service.docker.PortRow", {
	extend: "Ext.container.Container",
	alias: "widget.module.admin.service.docker.portrow",

	layout: "hbox",
	shadow: false,
	border: false,
	defaultType: "container",
	defaults: {
		flex: 2
	},

	initComponent: function() {
		var me = this;
		me.items = [{
			xtype: "textfield",
			name: "hostip-" + me.portCount,
			value: "0.0.0.0",
			id: "hostip-" + me.portCount
		},{
			xtype: "textfield",
			name: "hostport-" + me.portCount,
			id: "hostport-" + me.portCount
		},{
			xtype: "combo",
			name: "exposedPort-" + me.portCount,
			id: "exposedPort-" + me.portCount,
			store: me.exposedPorts,
			queryMode: 'local',
			displayField: 'name',
			valueField: 'name',
			value: "Select",
			editable: false,
			listeners: {
				scope: me,
				change: function(combo, newValue, oldValue, eOpts) {
					me.queryById("customPort-" + me.portCount).setValue("");
				}
			}
		},{
			xtype: "textfield",
			name: "customPort-" + me.portCount,
			id: "customPort-" + me.portCount,
			listeners: {
				scope: me,
				change: function(combo, newValue, oldValue, eOpts) {
					if(newValue === "") {
						me.queryById("exposedPort-" + me.portCount).setDisabled(false);
					} else {
						me.queryById("exposedPort-" + me.portCount).setValue("Select");
						me.queryById("exposedPort-" + me.portCount).setDisabled(true);
						me.queryById("customPort-" + me.portCount).setValue(newValue);
					}
				}
			}

		},{
			xtype: "button",
			id: "portForwardAddButton-" + me.portCount,
			icon: "images/add.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			width: 24,
			flex: 0,
			listeners: {
				click: function(button, e , eOpts) {
					//TODO: Validate form data before comitting
					var errorMsg = me.validateData();
					if(errorMsg === "") {
						Ext.getCmp("dockerRunImageWindow").portForwards[me.portCount] = {
							hostip: me.queryById("hostip-" + me.portCount).getValue(),
							hostport: me.queryById("hostport-" + me.portCount).getValue(),
							exposedPort: me.queryById("exposedPort-" + me.portCount).getValue(),
							customPort: me.queryById("customPort-" + me.portCount).getValue()
						};
						var nextCount = parseInt(me.portCount)+1;
						button.setHidden(true);
						me.queryById("portForwardDelButton-" + me.portCount).setHidden(false);
						var newRow = Ext.create("OMV.module.admin.service.docker.PortRow", {
							portCount: nextCount,
							id: "dockerPortForward-" + nextCount,
							exposedPorts: me.exposedPorts
						});
						Ext.getCmp("dockerPortForward").add(newRow);
						me.queryById("hostip-" + me.portCount).setReadOnly(true);
						me.queryById("hostport-" + me.portCount).setReadOnly(true);
						me.queryById("exposedPort-" + me.portCount).setReadOnly(true);
						me.queryById("customPort-" + me.portCount).setReadOnly(true);
					} else {
						Ext.Msg.alert("Bad input", errorMsg);
					}
				}	
			}
		},{
			xtype: "button",
			id: "portForwardDelButton-" + me.portCount,
			icon: "images/delete.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			width: 24,
			flex: 0,
			hidden: true,
			listeners: {
				click: function(button, e , eOpts) {
					delete Ext.getCmp("dockerRunImageWindow").portForwards[me.portCount];
					Ext.getCmp("dockerPortForward").remove("dockerPortForward-" + me.portCount);
				}
			}
		}];
		Ext.apply(me, {
		});
		me.callParent(arguments);
	},

	validateData: function() {
		var me = this;
		var hostip = me.queryById("hostip-" + me.portCount).getValue();
		var hostport = me.queryById("hostport-" + me.portCount).getValue();
		var exposedport = me.queryById("exposedPort-" + me.portCount).getValue();
		var customport = me.queryById("customPort-" + me.portCount).getValue();
		var errorMsg = "";
		if (!(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(hostip))) {
			errorMsg = errorMsg + "Illegal host ip supplied</br>";
		}
		if(isNaN(hostport) || hostport > 65535 || hostport === "" || hostport < 1) {
			errorMsg = errorMsg + "Illegal host port supplied</br>";
		}
		if(exposedport === "Select" && customport === "") {
			errorMsg = errorMsg + "Either an exposed port, or a custom port must be specified</br>";
		}
		if(customport !== "" && (isNaN(customport) || customport > 65535 || customport < 1)) {
			errorMsg = errorMsg + "Illegal custom port supplied</br>";
		}
		return errorMsg;
	}
});
