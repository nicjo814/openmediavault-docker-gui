Ext.define("OMV.module.admin.service.docker.BindMountRow", {
	extend: "Ext.container.Container",

	layout: "hbox",
	shadow: false,
	border: false,
	defaultType: "container",

	initComponent: function() {
		var me = this;
		me.items = [{
			xtype: "textfield",
			name: "bindMountFrom-" + me.bindCount,
			id: "bindMountFrom-" + me.bindCount,
			flex: 1
		},{
			xtype: "textfield",
			name: "bindMountTo-" + me.bindCount,
			id: "bindMountTo-" + me.bindCount,
			flex: 2
		},{
			xtype: "button",
			id: "bindMountAddButton-" + me.bindCount,
			icon: "images/add.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			listeners: {
				click: function(button, e , eOpts) {
					var errorMsg = me.validateData();
					if(errorMsg === "") {
						var nextCount = parseInt(me.bindCount)+1;
						button.setHidden(true);
						Ext.getCmp("bindMountDelButton-" + me.bindCount).setHidden(false);
						var newRow = Ext.create("OMV.module.admin.service.docker.BindMountRow", {
							bindCount: nextCount,
							id: "bindMountRow-" + nextCount
						});
						Ext.getCmp("dockerBindMounts").add(newRow);
						me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
						me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
					} else {
						Ext.Msg.alert("Bad input", errorMsg);
					}
				}	
			}
		},{
			xtype: "button",
			id: "bindMountDelButton-" + me.envCount,
			icon: "images/delete.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			hidden: true,
			listeners: {
				click: function(button, e , eOpts) {
					Ext.getCmp("dockerBindMounts").remove("bindMountRow-" + me.bindCount);
				}
			}
		}];
		Ext.apply(me, {
		});
		me.callParent(arguments);
	},

	validateData: function() {
		var me = this;
		var from = me.queryById("bindMountFrom-" + me.bindCount).getValue();
		var to = me.queryById("bindMountTo-" + me.bindCount).getValue();

		var errorMsg = "";
		if (from === "") {
			errorMsg = errorMsg + "Host path must not be empty";
		}
		if (to === "") {
			errorMsg = errorMsg + "Container path must not be empty";
		}
		return errorMsg;
	}
});
