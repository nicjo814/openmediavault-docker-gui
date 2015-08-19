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

	hostip: "0.0.0.0",
	hostport: 0,
	exposedport: "Select",
	customport: 0,

	initComponent: function() {
		var me = this;
		me.items = [{
			xtype: "textfield",
			name: "hostip-" + me.portCount,
			value: "0.0.0.0",
			id: "hostip-" + me.portCount,
			value: me.hostip,
			regex: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
			invalidText: "Not a valid IP number"
		},{
			xtype: "numberfield",
			minValue: 1,
			maxValue: 65535,
			invalidText: "Not a valid port number (1-65535)",
			name: "hostport-" + me.portCount,
			id: "hostport-" + me.portCount,
			value: me.hostport
		},{
			xtype: "combo",
			name: "exposedPort-" + me.portCount,
			id: "exposedPort-" + me.portCount,
			store: me.exposedPorts,
			queryMode: 'local',
			displayField: 'name',
			valueField: 'name',
			value: me.exposedport,
			editable: false,
			listeners: {
				scope: me,
				change: function(combo, newValue, oldValue, eOpts) {
					me.queryById("customPort-" + me.portCount).setValue("");
				}
			}
		},{
			xtype: "numberfield",
			allowBlank: true,
			minValue: 1,
			maxValue: 65535,
			invalidText: "Not a valid port number (1-65535)",
			name: "customPort-" + me.portCount,
			id: "customPort-" + me.portCount,
			value: me.customport,
			listeners: {
				scope: me,
				change: function(combo, newValue, oldValue, eOpts) {
					if(newValue === null) {
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
				scope: this,
				click: function(button, e , eOpts) {
					if(me.queryById("hostip-" + me.portCount).isValid() && me.queryById("hostport-" + me.portCount).isValid() && 
					   (me.queryById("exposedPort-" + me.portCount).getValue() !== "Select" || me.queryById("customPort-" + me.portCount).isValid()) &&
					  	me.queryById("customPort-" + me.portCount).getValue() !== null) {
						me.up('window').portForwards[me.portCount] = {
							hostip: me.queryById("hostip-" + me.portCount).getValue(),
							hostport: me.queryById("hostport-" + me.portCount).getValue(),
							exposedPort: me.queryById("exposedPort-" + me.portCount).getValue(),
							customPort: me.queryById("customPort-" + me.portCount).getValue()
						};
						var nextCount = parseInt(me.portCount)+1;
						me.queryById("portForwardAddButton-" + me.portCount).setHidden(true);
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
						Ext.Msg.alert("Error", "Bad input detected");
					}
				},
				setNewRow: function() {
					var me = this;
					me.up('window').portForwards[me.portCount] = {
						hostip: me.hostip,
						hostport: me.hostport,
						exposedPort: me.exposedport,
						customPort: me.customport
					};
					me.queryById("portForwardAddButton-" + me.portCount).setHidden(true);
					me.queryById("portForwardDelButton-" + me.portCount).setHidden(false);
					me.queryById("hostip-" + me.portCount).setReadOnly(true);
					me.queryById("hostport-" + me.portCount).setReadOnly(true);
					me.queryById("exposedPort-" + me.portCount).setReadOnly(true);
					me.queryById("customPort-" + me.portCount).setReadOnly(true);
					me.up('window').portCount = me.portCount+1;
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
				scope: me,
				click: function(button, e , eOpts) {
					delete me.up('window').portForwards[me.portCount];
					Ext.getCmp("dockerPortForward").remove("dockerPortForward-" + me.portCount);
				}
			}
		}];
		Ext.apply(me, {
		});
		me.callParent(arguments);
	}

});
