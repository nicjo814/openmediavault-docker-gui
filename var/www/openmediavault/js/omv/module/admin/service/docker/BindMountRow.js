Ext.define("OMV.module.admin.service.docker.BindMountRow", {
	extend: "Ext.container.Container",
	alias: "widget.module.admin.service.docker.bindmountrow", 

	layout: "hbox",
	shadow: false,
	border: false,
	defaultType: "container",

	from: "",
	to: "",

	initComponent: function() {
		var me = this;
		me.items = [{
			xtype: "textfield",
			name: "bindMountFrom-" + me.bindCount,
			id: "bindMountFrom-" + me.bindCount,
			flex: 1,
			value: me.from,
			regex: /^[\/]{1}.*$/,
			invalidText: "Must be an absolute path that begins with /",
			allowBlank: false
		},{
			xtype: "textfield",
			name: "bindMountTo-" + me.bindCount,
			id: "bindMountTo-" + me.bindCount,
			flex: 1,
			value: me.to,
			regex: /^[\/]{1}.*$/,
			invalidText: "Must be an absolute path that begins with /",
			allowBlank: false
		},{
			xtype: "button",
			id: "bindMountAddButton-" + me.bindCount,
			icon: "images/add.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			listeners: {
				scope: this,
				click: function(button, e , eOpts) {
					if(me.queryById("bindMountFrom-" + me.bindCount).isValid() && me.queryById("bindMountTo-" + me.bindCount).isValid()) {
						me.up('window').bindMounts[me.bindCount] = {
							from: me.queryById("bindMountFrom-" + me.bindCount).getValue(),
							to: me.queryById("bindMountTo-" + me.bindCount).getValue()
						};
						var nextCount = parseInt(me.bindCount)+1;
						me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
						me.queryById("bindMountDelButton-" + me.bindCount).setHidden(false);
						var newRow = Ext.create("OMV.module.admin.service.docker.BindMountRow", {
							bindCount: nextCount,
							id: "bindMountRow-" + nextCount
						});
						Ext.getCmp("dockerBindMounts").add(newRow);
						me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
						me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
					} else {
						Ext.Msg.alert("Error", "Bad input detected");
					}
				},	
				setNewRow: function(button) {
					var me = this;
					me.up('window').bindMounts[me.bindCount] = {
						from: me.from,
						to: me.to
					};
					me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
					me.queryById("bindMountDelButton-" + me.bindCount).setHidden(false);
					me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
					me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
					me.up('window').bindCount = me.bindCount+1;
				}
			}
		},{
			xtype: "button",
			id: "bindMountDelButton-" + me.bindCount,
			icon: "images/delete.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			flex: 0,
			width: 24,
			hidden: true,
			listeners: {
				click: function(button, e , eOpts) {
					delete me.up('window').bindMounts[me.bindCount];
					Ext.getCmp("dockerBindMounts").remove("bindMountRow-" + me.bindCount);
				}
			}
		}];
		Ext.apply(me, {
		});
		me.callParent(arguments);
	}
});
