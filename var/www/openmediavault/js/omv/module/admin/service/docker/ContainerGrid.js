Ext.define("OMV.module.admin.service.docker.ContainerGrid", {
	extend: "OMV.workspace.grid.Panel",
	alias: "widget.module.admin.service.docker.containergrid",

	id: "dockerContainerGrid",
	disableDeleteButton: true,
	deleteButtonText: _("Delete"),

	rpcService: "Docker",
	rpcGetMethod: "getContainers",
	requires: [
		"OMV.data.Store",
		"OMV.data.Model",
		"OMV.data.proxy.Rpc",
	],

	stateful: true,
	stateId: "280eb3e7-c505-449c-9c84-1eb1b62b6b6a",

	defaults: {
		flex: 1
	},

	columns: [{
		text: _("CONTAINER ID"),
		dataIndex: 'id',
		sortable: true,
		stateId: 'id',
	},{
		text: _("IMAGE"),
		dataIndex: 'image',
		sortable: true,
		stateId: 'image',
	},{
		text: _("COMMAND"),
		dataIndex: 'command',
		sortable: true,
		stateId: 'command'
	},{
		text: _("CREATED"),
		dataIndex: 'created',
		sortable: true,
		stateId: 'created'
	},{
		text: _("STATUS"),
		dataIndex: 'status',
		sortable: true,
		stateId: 'status'
	},{
		text: _("PORTS"),
		dataIndex: 'ports',
		sortable: true,
		stateId: 'ports'
	},{
		text: _("NAMES"),
		dataIndex: 'name',
		sortable: true,
		stateId: 'name'
	}],

	initComponent: function() {
		var me = this;
		Ext.apply(me, {
			store: Ext.create("OMV.data.Store", {
				autoLoad: true,
				model: OMV.data.Model.createImplicit({
					fields: [
						{ name: "id", type: "string" },
						{ name: "image", type: "string" },
						{ name: "command", type: "string" },
						{ name: "created", type: "string" },
						{ name: "status", type: "string" },
						{ name: "ports", type: "string" },
						{ name: "name", type: "string" }
					]
				}),
				proxy: {
					type: "rpc",
					rpcData: {
						service: "Docker",
						method: "getContainers",
					}
				}
			})
		});
		me.callParent(arguments);
	},

	getTopToolbarItems: function(c) {
		var me = this;
		return [{
			id: me.getId() + "-start",
			xtype: "button",
			text: "Start",
			icon: "images/play.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: true,
			handler: Ext.Function.bind(me.onStartButton, me, [ me ]),
			scope: me
		},{
			id: me.getId() + "-stop",
			xtype: "button",
			text: "Stop",
			icon: "images/docker_stop.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: true,
			handler: Ext.Function.bind(me.onStopButton, me, [ me ]),
			scope: me
		},{
			id: me.getId() + "-restart",
			xtype: "button",
			text: "Restart",
			icon: "images/refresh.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: true,
			handler: Ext.Function.bind(me.onRestartButton, me, [ me ]),
			scope: me
		},{
			id: me.getId() + "-copy",
			xtype: "button",
			text: "Copy",
			icon: "images/docker_copy.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: true,
			handler: Ext.Function.bind(me.onCopyButton, me, [ me ]),
			scope: me
		},{
			id: me.getId() + "-delete",
			xtype: "button",
			text: me.deleteButtonText,
			icon: "images/delete.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: true,
			handler: Ext.Function.bind(me.onDeleteButton, me, [ me ]),
			scope: me
		}]
	},

	onSelectionChange: function(model, records) {
		var me = this;
		if(me.hideTopToolbar)
			return;
		var tbarBtnName = [ "start", "stop", "restart", "copy", "delete" ];
		var tbarBtnDisabled = {
			"start": false,
			"stop": false,
			"restart": false,
			"copy": false,
			"delete": false
		};
		// Enable/disable buttons depending on the number of selected rows.
		if(records.length <= 0) {
			tbarBtnDisabled["start"] = true;
			tbarBtnDisabled["stop"] = true;
			tbarBtnDisabled["restart"] = true;
			tbarBtnDisabled["copy"] = true;
			tbarBtnDisabled["delete"] = true;
		} else if(records.length == 1) {
			// Disable 'Start' and 'Delete' buttons if selected node is not stopped
			Ext.Array.each(records, function(record) {
				if(!(record.get("state") === "dead" || record.get("state") === "stopped")) {
					tbarBtnDisabled["start"] = true;
					tbarBtnDisabled["delete"] = true;
					return false;
				}
			});
			// Disable 'Stop' button if selected node is not running
			Ext.Array.each(records, function(record) {
				if(!(record.get("state") === "running")) {
					tbarBtnDisabled["stop"] = true;
					return false;
				}
			});
		} else {
			tbarBtnDisabled["start"] = true;
			tbarBtnDisabled["stop"] = true;
			tbarBtnDisabled["restart"] = true;
			tbarBtnDisabled["copy"] = true;
			// Disable 'Delete' button if selected nodes are not stopped
			Ext.Array.each(records, function(record) {
				if(!(record.get("state") === "dead" || record.get("state") === "stopped")) {
					tbarBtnDisabled["delete"] = true;
					return false;
				}
			});
		}

		// Update the button controls.
		Ext.Array.each(tbarBtnName, function(name) {
			var tbarBtnCtrl = me.queryById(me.getId() + "-" + name);
			if(!Ext.isEmpty(tbarBtnCtrl)) {
				if(true == tbarBtnDisabled[name]) {
					tbarBtnCtrl.disable();
				} else {
					tbarBtnCtrl.enable();
				}
			}
		});
	},

	onStartButton: function() {
		var me = this;
		var sm = me.getSelectionModel();
		var records = sm.getSelection();
		var record = records[0];
		OMV.Rpc.request({
			scope: me,
			callback: function(id, success, response) {
				me.doReload();
			},
			relayErrors: false,
			rpcData: {
				service: "Docker",
				method: "startContainer",
				params: {
					id: record.get("id")
				}
			}
		});
	},

	onStopButton: function() {
		var me = this;
		var sm = me.getSelectionModel();
		var records = sm.getSelection();
		var record = records[0];
		OMV.Rpc.request({
			scope: me,
			callback: function(id, success, response) {
				me.doReload();
			},
			relayErrors: false,
			rpcData: {
				service: "Docker",
				method: "stopContainer",
				params: {
					id: record.get("id")
				}
			}
		});
	},

	onRestartButton: function() {
		var me = this;
		var sm = me.getSelectionModel();
		var records = sm.getSelection();
		var record = records[0];
		OMV.Rpc.request({
			scope: me,
			callback: function(id, success, response) {
				me.doReload();
			},
			relayErrors: false,
			rpcData: {
				service: "Docker",
				method: "restartContainer",
				params: {
					id: record.get("id")
				}
			}
		});
	},

	doDeletion: function(record) {
		var me = this;
		OMV.Rpc.request({
			scope: me,
			callback: me.onDeletion,
			rpcData: {
				service: "Docker",
				method: "deleteContainer",
				params: {
					id: record.get('id')
				}
			}
		});
	}



});