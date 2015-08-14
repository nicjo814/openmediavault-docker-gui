// require("js/omv/window/Window.js")
// require("js/omv/form/Panel.js")
// require("js/omv/Rpc.js")

Ext.define("OMV.module.admin.service.docker.ImageInfo", {
	extend: "OMV.window.Window",

	repository: "",
	scrollable: true,
	buttonAlign: "center",
	closable: true,

	initComponent: function() {
		var me = this;
		Ext.apply(me, {
			items: [
			],
			buttons: [{
				id: me.getId() + "-close",
				text: _("Close"),
				hidden: false,
				handler: me.winClose,
				scope: me
			}],
		});

		OMV.Rpc.request({
			scope: me,
			callback: function(id, success, response) {
				me.add({
					xtype: "panel",
					html: response.info,
					scrollable: true

				});
			},
			relayErrors: false,
			rpcData: {
				service: "Docker",
				method: "getImageInfo",
				params: {
					repository: me.repository
				}
			}
		});

		me.callParent(arguments);
	},

	winClose: function() {
		var me = this;
		me.close();
	}

});

