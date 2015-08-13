// require("js/omv/workspace/window/Form.js")
// require("js/omv/Rpc.js")
// require("js/omv/module/admin/service/docker/PortRow.js")
// require("js/omv/module/admin/service/docker/EnvVarRow.js")
// require("js/omv/module/admin/service/docker/BindMountRow.js")

Ext.define("OMV.module.admin.service.docker.CopyContainer", {
	extend: "OMV.workspace.window.Form",
	requires: [
		"OMV.module.admin.service.docker.PortRow",
		"OMV.module.admin.service.docker.EnvVarRow",
		"OMV.module.admin.service.docker.BindMountRow",
	],

	title: _("Copy container"),
	id: "dockerCopyContainerWindow",
	layout: "fit",
	width: 600,
	closable: true,
	resizable: true,
	buttonAlign: "center",

	rpcService   : "Docker",
	rpcSetMethod : "runImage",

	//Some variables that are used
	ports: [],
	envvars: [],
	restartpolicy: "no",
	privileged: false,
	networkmode: "Bridge",
	portbindings: [],
	cenvvars: [],
	bindmounts: [],


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
				{"mode": "Bridged"},
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

		//Add environment variables fieldset
		items.push({
			xtype: "fieldset",
			title: _("Environment variables"),
			id: "dockerEnvVars",
			collapsible: true,
			collapsed: true,
			padding: "0 10 10 10",
			items: [{
				xtype: "container",
				layout: "hbox",
				shadow: false,
				border: false,
				defaultType: "container",
				items: [{html: "<b>Name</b>", flex: 1},
					{html: "<b>Value</b>", flex: 2},
					{html: " ", flex: 0, width: 24
					}]
			}]
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

	beforeRender: function() {
		var me = this;
		me.callParent(arguments);
		if(me.restartpolicy === "always") {
			me.getForm().findField("restart").setValue(true);
		}
		me.getForm().findField("privileged").setValue(me.privileged);
		me.getForm().findField("networkMode").setValue(me.networkmode);

		//Add any ports mapped in container
		var portFieldset = me.queryById("dockerPortForward");
		var exposedPorts = Ext.create('Ext.data.Store', {
			fields: ['name']
		});	
		exposedPorts.loadData(me.ports);
		var tmpString;
		var portsObj = {};
		for (i = 0; i < me.ports.length; i++) {
			tmpString = me.ports[i].name;
			portsObj[tmpString] = "";
		}
		for (i = 0; i < me.portbindings.length; i++) {
			portFieldset.add({
				xtype: "module.admin.service.docker.portrow",
				portCount: me.portCount,
				id: "dockerPortForward-" + me.portCount,
				exposedPorts: exposedPorts
			});
			me.queryById("hostip-" + me.portCount).setValue(me.portbindings[i].hostip);
			me.queryById("hostip-" + me.portCount).setReadOnly(true);
			me.queryById("hostport-" + me.portCount).setValue(me.portbindings[i].hostport);
			me.queryById("hostport-" + me.portCount).setReadOnly(true);
			if(me.portbindings[i].containerportstring in portsObj) {
				me.queryById("exposedPort-" + me.portCount).setValue(me.portbindings[i].containerportstring);
				me.queryById("customPort-" + me.portCount).setValue("");
			} else {
				me.queryById("exposedPort-" + me.portCount).setValue("Select");
				me.queryById("customPort-" + me.portCount).setValue(me.portbindings[i].containerportnr);
			}
			me.queryById("exposedPort-" + me.portCount).setReadOnly(true);
			me.queryById("customPort-" + me.portCount).setReadOnly(true);
			me.queryById("portForwardAddButton-" + me.portCount).setHidden(true);
			me.queryById("portForwardDelButton-" + me.portCount).setHidden(false);
			me.portForwards[me.portCount] = {
				hostip: me.queryById("hostip-" + me.portCount).getValue(),
				hostport: me.queryById("hostport-" + me.portCount).getValue(),
				exposedPort: me.queryById("exposedPort-" + me.portCount).getValue(),
				customPort: me.queryById("customPort-" + me.portCount).getValue()
			};
			me.portCount = me.portCount+1;
		}
		//Add an empty port forwarding row
		portFieldset.add({
			xtype: "module.admin.service.docker.portrow",
			portCount: me.portCount,
			id: "dockerPortForward-" + me.portCount,
			exposedPorts: exposedPorts
		});

		//Add environment variables
		var envVarsFieldset = me.queryById("dockerEnvVars");
		if(me.cenvvars === []) {
			me.cenvvars = me.envvars;
		}
		var keys = Object.keys(me.cenvvars);	
		for (i = 0; i < keys.length; i++) {
			tmpString = keys[i];
			if(tmpString in me.envvars && me.cenvvars[tmpString] === me.envvars[tmpString]) {
				envVarsFieldset.add({
					xtype: "module.admin.service.docker.envvarrow",
					envCount: me.envCount,
					id: "envVarRow-" + me.envCount,
					nameVal: tmpString,
					valueVal: me.cenvvars[tmpString],
					defaultVal: "true"
				});
			} else {
				envVarsFieldset.add({
					xtype: "module.admin.service.docker.envvarrow",
					envCount: me.envCount,
					id: "envVarRow-" + me.envCount,
					nameVal: tmpString,
					valueVal: me.cenvvars[tmpString]
				});
				me.queryById("envVarAddButton-" + me.envCount).setHidden(true);
				me.queryById("envVarDelButton-" + me.envCount).setHidden(false);
				me.envVars[me.envCount] = {
					name: me.queryById("envName-" + me.envCount).getValue(),
					value: me.queryById("envValue-" + me.envCount).getValue()
				};
			}
			me.envCount = me.envCount+1;
		}
		//Add empty environment variable row
		envVarsFieldset.add({
			xtype: "module.admin.service.docker.envvarrow",
			envCount: me.envCount,
			id: "envVarRow-" + me.envCount,
		});

		//Add bind mounts
		var bindMountsFieldset = me.queryById("dockerBindMounts");
		for (i = 0; i < me.bindmounts.length; i++) {
			bindMountsFieldset.add({
				xtype: "module.admin.service.docker.bindmountrow", 
				bindCount: me.bindCount,
				id: "bindMountRow-" + me.bindCount
			});
			me.queryById("bindMountFrom-" + me.bindCount).setValue(me.bindmounts[i].from);
			me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
			me.queryById("bindMountTo-" + me.bindCount).setValue(me.bindmounts[i].to);
			me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
			me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
			me.queryById("bindMountDelButton-" + me.bindCount).setHidden(false);
			me.bindMounts[me.bindCount] = {
				from: me.queryById("bindMountFrom-" + me.bindCount).getValue(),
				to: me.queryById("bindMountTo-" + me.bindCount).getValue()
			};
			me.bindCount = me.bindCount+1;
		}
		//Add empty bind mount row
		bindMountsFieldset.add({
			xtype: "module.admin.service.docker.bindmountrow", 
			bindCount: me.bindCount,
			id: "bindMountRow-" + me.bindCount
		});
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

