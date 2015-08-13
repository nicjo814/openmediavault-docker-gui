// require("js/omv/workspace/window/Form.js")
// require("js/omv/Rpc.js")
// require("js/omv/module/admin/service/docker/PortRow.js")
// require("js/omv/module/admin/service/docker/EnvVarRow.js")
// require("js/omv/module/admin/service/docker/BindMountRow.js")

Ext.define("OMV.module.admin.service.docker.RunImage", {
	extend: "OMV.workspace.window.Form",
	requires: [
		"OMV.module.admin.service.docker.PortRow",
		"OMV.module.admin.service.docker.EnvVarRow",
		"OMV.module.admin.service.docker.BindMountRow",
	],

	title: _("Run image"),
	id: "dockerRunImageWindow",
	layout: "fit",
	width: 600,
	closable: true,
	resizable: true,
	buttonAlign: "center",

	rpcService   : "Docker",
	rpcSetMethod : "runImage",

	initComponent: function() {
		var me = this;

		//Initiate counters used to create id's
		me.portCount = 1;
		me.envCount = 1;
		me.bindCount = 1;

		me.portForwards = [];
		me.envVars = [];
		me.bindMounts = [];

		me.callParent(arguments);
	},

	getFormItems : function() {
		var me = this;

		var items = [];

		//Add general fieldset
		items.push({
			xtype: "fieldset",
			title: _("General"),
			items: [{
				xtype: "textfield",
				fieldLabel: _("Docker image"),
				value: me.image,
				readOnly: true,
				name: "image",
				id: "dockerImageName"
			},{
				xtype: "checkbox",
				name: "restart",
				boxLabel: "Restart on system reboot"
			},{
				xtype: "checkbox",
				name: "privileged",
				boxLabel: "Run container in privileged mode"
			}]	
		});

		//Create data store for network mode selection
		var networkModes = Ext.create('Ext.data.Store', {
			fields: ['mode'],
			data : [
				{"mode": "Bridge"},
				{"mode": "Host"},
				{"mode": "None"}
			]
		});

		//Create data store for selection of exposed network ports
		//by the image
		var exposedPorts = Ext.create('Ext.data.Store', {
			fields: ['name']
		});	
		exposedPorts.loadData(me.ports);

		//Add networking fieldset
		items.push({
			xtype: "fieldset",
			title: _("Networking"),
			collapsible: true,
			items: [{
				xtype: "combo",
				store: networkModes,
				fieldLabel: "Network mode",
				queryMode: 'local',
				displayField: 'mode',
				valueField: 'mode',
				value: "Bridged",
				editable: false,
				name: "networkMode",
				listeners: {
					scope: me,
					change: function(combo, newValue, oldValue, eOpts) {
						var portField = me.queryById("dockerPortForward");
						if(newValue === "Host" || newValue === "None") {
							portField.setHidden(true);
							portField.setDisabled(true);
						} else {
							portField.setHidden(false);
							portField.setDisabled(false);
						}
					}
				}
			},{
				xtype: "fieldset",
				title: _("Port forwarding"),
				id: "dockerPortForward",
				padding: "0 10 10 10",
				items: [{
					xtype: "container",
					layout: "hbox",
					shadow: false,
					border: false,
					defaultType: "container",
					defaults: {
						flex: 2
					},
					items: [{html: "<b>Host IP</b>"},
						{html: "<b>Host Port</b>"},
						{html: "<b>Exposed Port</b>"},
						{html: "<b>Custom Port</b>"},
						{html: " ", flex: 0, width: 24
						}]
				},{
					xtype: "module.admin.service.docker.portrow",
					portCount: me.portCount,
					id: "dockerPortForward-" + me.portCount,
					exposedPorts: exposedPorts
				}]
			}]	
		});

		//Create environment variable rows defined in the image and one empty row
		var envVarRows = [{
			xtype: "container",
			layout: "hbox",
			shadow: false,
			border: false,
			defaultType: "container",
			items: [{html: "<b>Name</b>", flex: 1},
				{html: "<b>Value</b>", flex: 2},
				{html: " ", flex: 0, width: 24
				}]
		}];
	
		var keys = Object.keys(me.envvars);	
		for (i = 0; i < keys.length; i++) {
			envVarRows.push({
				xtype: "module.admin.service.docker.envvarrow",
				envCount: me.envCount,
				id: "envVarRow-" + me.envCount,
				nameVal: keys[i],
				valueVal: me.envvars[keys[i]],
				defaultVal: "true"
			});
			me.envCount = me.envCount+1;
		}
		envVarRows.push({
			xtype: "module.admin.service.docker.envvarrow",
			envCount: me.envCount,
			id: "envVarRow-" + me.envCount,
		});

		//Add environment variables fieldset
		items.push({
			xtype: "fieldset",
			title: _("Environment variables"),
			id: "dockerEnvVars",
			collapsible: true,
			collapsed: true,
			padding: "0 10 10 10",
			items: envVarRows
		});

		//Add bind mounts fieldset
		items.push({
			xtype: "fieldset",
			title: _("Bind mounts"),
			id: "dockerBindMounts",
			collapsible: true,
			padding: "0 10 10 10",
			items: [{
				xtype: "container",
				layout: "hbox",
				shadow: false,
				border: false,
				defaultType: "container",
				items: [{html: "<b>Host path</b>", flex: 1},
					{html: "<b>Container path</b>", flex: 1},
					{html: " ", flex: 0, width: 24
					}]
			},{
				xtype: "module.admin.service.docker.bindmountrow", 
				bindCount: me.bindCount,
				id: "bindMountRow-" + me.bindCount
			}]
		});
		
		items.push({
			xtype: "hiddenfield",
			name: "makeDirty",
			value: "false",
			id: "dockerMakeDirty"
		});

		return items;

	},

	afterRender: function() {
		var me = this;
		me.callParent(arguments);

		Ext.getCmp("dockerMakeDirty").setValue("true");
	},

	doSubmit: function() {
		var me = this;
		var params = {
			image: me.getForm().findField("image").getValue(),
			restart: me.getForm().findField("restart").getValue(),
			privileged: me.getForm().findField("privileged").getValue(),
			networkMode: me.getForm().findField("networkMode").getValue(),
			portForwards: me.portForwards,
			envVars: me.envVars,
			bindMounts: me.bindMounts
		};
		if(me.mode === "remote") {
			var rpcOptions = {
				scope: me,
				callback: me.onSubmit,
				relayErrors: true,
				rpcData: {
					service: me.rpcService,
					method: me.rpcSetMethod || "set",
					params: params
					//params: me.getRpcSetParams()
				}
			};
			if(me.fireEvent("beforesubmit", me, rpcOptions) === false)
				return;
			// Display waiting dialog.
			me.mask(me.submitMsg);
			// Execute RPC.
			OMV.Rpc.request(rpcOptions);
		} else {
			var params = me.getRpcSetParams();
			me.fireEvent("submit", me, params);
			me.close();
		}
	},

	onSubmit: function(id, success, response) {
		var me = this;
		// Is this a long running RPC? If yes, then periodically check
		// if it is still running, otherwise we are finished here and
		// we can notify listeners and close the window.
		if(me.rpcSetPollStatus) {
			if(!success) {
				me.unmask();
				OMV.MessageBox.error(null, response);
				me.fireEvent("exception", me, response);
				return;
			}
			// Execute RPC.
			OMV.Rpc.request({
				scope: me,
				callback: me.onIsRunning,
				relayErrors: true,
				rpcData: {
					service: "Exec",
					method: "isRunning",
					params: {
						filename: response
					}
				}
			});
		} else {
			me.unmask();
			if(success) {
				var values = me.getRpcSetParams();
				me.fireEvent("submit", me, values, response);
				me.close();
				Ext.getCmp("dockerContainerGrid").doReload();
			} else {
				OMV.MessageBox.error(null, response);
				me.fireEvent("exception", me, response);
			}
		}
	},

});

