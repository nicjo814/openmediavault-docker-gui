Ext.define("OMV.module.admin.service.docker.ContainerGrid", {
	extend: "OMV.workspace.grid.Panel",
	alias: "widget.module.admin.service.docker.containergrid",

	disableDeleteButton: true,
	deleteButtonText: _("Delete"),
	disablePullButton: false,
	pullButtonText: _("Pull Image"),
	disableRunButton: true,
	runButtonText: _("Run Image"),

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
	}

});
