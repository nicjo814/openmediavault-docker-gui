// require("js/omv/Rpc.js")

Ext.define("OMV.module.admin.service.docker.SearchBox", {
	extend: "Ext.form.field.ComboBox",

	alias: "widget.module.admin.service.docker.searchbox",

	queryMode: 'local',
	displayField: 'name',
	valueField: 'name',
	triggerAction:'all',
	typeAhead: false,
	hideTrigger:true,

	initComponent: function() {
		var me = this;

		//Create data store for selection of filesystem path
		var store = Ext.create('Ext.data.Store', {
			fields: [
				{name: "name", type: "string"},
				{name: "description" , type: "string"},
				{name: "stars", type: "integer"}
			]
		});
		me.setStore(store);
		me.callParent(arguments);
	},


	onChange: function(box, newValue, oldValue, eOpts) {
		var me = this;
		if(this.getValue() !== null && this.getValue().length > 2) {
			
			OMV.Rpc.request({
				scope: this,
				callback: function(id, success, response) {
					this.getStore().removeAll();
					this.getStore().loadData(response);
				},
				relayErrors: false,
				rpcData: {
					service: "Docker",
					method: "searchImages",
					params: {
						name: this.getValue()
					}
				}
			});
		}
		me.callParent(arguments);
	}


});

