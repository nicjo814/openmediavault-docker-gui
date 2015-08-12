// require("js/omv/module/admin/service/docker/PortRow.js")
// require("js/omv/module/admin/service/docker/EnvVarRow.js")
// require("js/omv/module/admin/service/docker/BindMountRow.js")
// require("js/omv/module/admin/service/docker/PullImage.js")
// require("js/omv/module/admin/service/docker/RunImage.js")

Ext.define("OMV.module.admin.service.docker.ImageGrid", {
	extend: "OMV.workspace.grid.Panel",
	alias: "widget.module.admin.service.docker.imagegrid",

	id: "dockerImageGrid",
	disableDeleteButton: true,
	deleteButtonText: _("Delete"),
	disablePullButton: false,
	pullButtonText: _("Pull Image"),
	disableRunButton: true,
	runButtonText: _("Run Image"),

	rpcService: "Docker",
	rpcGetMethod: "getImages",
	requires: [
		"OMV.data.Store",
		"OMV.data.Model",
		"OMV.data.proxy.Rpc",
		"OMV.module.admin.service.docker.PortRow",
		"OMV.module.admin.service.docker.EnvVarRow",
		"OMV.module.admin.service.docker.BindMountRow",
		"OMV.module.admin.service.docker.PullImage",
		"OMV.module.admin.service.docker.RunImage"
	],

	stateful: true,
	stateId: "24eb8cc1-3b30-48d0-9309-f278a3ad42fb",

	defaults: {
		flex: 1
	},

	columns: [{
		text: _("REPOSITORY"),
		dataIndex: 'repository',
		sortable: true,
		stateId: 'repository',
	},{
		text: _("TAG"),
		dataIndex: 'tag',
		sortable: true,
		stateId: 'tag',
	},{
		text: _("IMAGE ID"),
		dataIndex: 'id',
		sortable: true,
		stateId: 'id'
	},{
		text: _("CREATED"),
		dataIndex: 'created',
		sortable: true,
		stateId: 'created'
	},{
		text: _("VIRTUAL SIZE"),
		dataIndex: 'size',
		sortable: true,
		stateId: 'size	'
	}],

	initComponent: function() {
		var me = this;
		Ext.apply(me, {
			store: Ext.create("OMV.data.Store", {
				autoLoad: true,
				model: OMV.data.Model.createImplicit({
					fields: [
						{ name: "repository", type: "string" },
						{ name: "tag", type: "string" },
						{ name: "id", type: "string" },
						{ name: "created", type: "string" },
						{ name: "size", type: "string" },
						{ name: "ports", type: "array" },
						{ name: "envvars", type: "array" }
					]
				}),
				proxy: {
					type: "rpc",
					rpcData: {
						service: "Docker",
						method: "getImages",
					}
				}
			})
		});
		me.callParent(arguments);
	},

	getTopToolbarItems: function(c) {
		var me = this;
		return [{
			id: me.getId() + "-pull",
			xtype: "button",
			text: me.pullButtonText,
			icon: "images/download.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: me.disablePullButton,
			handler: Ext.Function.bind(me.onPullButton, me, [ me ]),
			scope: me
		},{
			id: me.getId() + "-run",
			xtype: "button",
			text: me.runButtonText,
			icon: "images/play.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: me.disableRunButton,
			handler: Ext.Function.bind(me.onRunButton, me, [ me ]),
			scope: me
		},{
			id: me.getId() + "-delete",
			xtype: "button",
			text: me.deleteButtonText,
			icon: "images/delete.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			disabled: me.disableDeleteButton,
			handler: Ext.Function.bind(me.onDeleteButton, me, [ me ]),
			scope: me
		},{
			id: me.getId() + "-refresh",
			xtype: "button",
			text: "Refresh",
			icon: "images/refresh.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			hidden: false,
			handler: Ext.Function.bind(me.onRefreshButton, me, [ me ]),
			scope: me
		}]
	},

	onSelectionChange: function(model, records) {
		var me = this;
		if(me.hideTopToolbar)
			return;
		var tbarBtnName = [ "pull", "run", "delete", "refresh" ];
		var tbarBtnDisabled = {
			"pull": false,
			"run": false,
			"delete": false,
			"refresh": false
		};
		// Enable/disable buttons depending on the number of selected rows.
		if(records.length <= 0) {
			tbarBtnDisabled["run"] = true;
			tbarBtnDisabled["delete"] = true;
		} else if(records.length == 1) {
			tbarBtnDisabled["run"] = false;
			tbarBtnDisabled["delete"] = false;
		} else {
			tbarBtnDisabled["run"] = true;
			tbarBtnDisabled["delete"] = false;
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

	onPullButton : function() {
		var me = this;
		Ext.create("OMV.module.admin.service.docker.PullImage", {
			title          : "Pull image",
			rpcService     : "Docker",
			rpcMethod      : "pullImage",
			hideStopButton : true,
			listeners      : {
				scope     : me,
				exception : function(wnd, error) {
					OMV.MessageBox.error(null, error);
				}
			}
		}).show();
	},

	doDeletion: function(record) {
		var me = this;
		OMV.Rpc.request({
			scope: me,
			callback: me.onDeletion,
			rpcData: {
				service: "Docker",
				method: "deleteImage",
				params: {
					id: record.get('id')
				}
			}
		});
	},

	onRunButton: function() {
		var me = this;
		var sm = me.getSelectionModel();
		var records = sm.getSelection();
		var record = records[0];
		Ext.create("OMV.module.admin.service.docker.RunImage", {
			image: record.get("repository") + ":" + record.get("tag"),
			ports: record.get("ports"),
			envvars: record.get("envvars")
		}).show();
	}

});
