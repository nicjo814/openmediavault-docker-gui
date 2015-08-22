// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/module/admin/service/docker/ImageGrid.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/form/field/SharedFolderComboBox.js")

Ext.define("OMV.module.admin.service.docker.Settings", {
    extend: "OMV.workspace.form.Panel",
    
    rpcService: "Docker",
    rpcGetMethod: "getSettings",
    rpcSetMethod: "setSettings",
    plugins: [{
		ptype: "configobject"
	}],

	uuid: "",

    initComponent : function() {
        this.on("load", function () {

			this.uuid = OMV.UUID_UNDEFINED;
			var parent = this.up("tabpanel");
				
            if (!parent) {
                return;
            }

            var overviewPanel = parent.down("panel[title=" + _("Overview") + "]");
            var settingsPanel = parent.down("panel[title=" + _("Settings") + "]");
            var dockerVersion = settingsPanel.findField("version").getValue();
			var checked = settingsPanel.findField("enabled").checked

			if (overviewPanel) {
				if (checked) {
					overviewPanel.tab.show();
					overviewPanel.enable();
					overviewPanel.down("dockerImageGrid").doReload();
					overviewPanel.down("dockerContainerGrid").doReload();
					parent.setActiveTab(overviewPanel);
				} else {
					overviewPanel.disable();
					overviewPanel.tab.hide();
				}
				if (dockerVersion === "0") {
					settingsPanel.findField("enabled").setDisabled(true);
					settingsPanel.findField("apiPort").setDisabled(true);
				} else {
					settingsPanel.findField("enabled").setDisabled(false);
					settingsPanel.findField("apiPort").setDisabled(false);
				}
			}
		}, this);

		this.callParent(arguments);
	},

	getFormItems: function() {
		var me = this;
		return [{
			xtype: "fieldset",
			title: _("General"),
			fieldDefaults: {
				labelSeparator: ""
			},
			items: [{
				xtype: "checkbox",
				name: "enabled",
				boxLabel: _("Enable the plugin"),
			},{
				xtype: "numberfield",
				anchor: '100%',
				maxValue: 65535,
				minValue: 0,
				name: "apiPort",
				allowBlank: false,
				plugins: [{
					ptype: "fieldinfo",
					text: _("Network port that the Docker API listens on. The plugin must be enabled for a change to be committed")
				}],
			},{
				xtype: "sharedfoldercombo",
				name: "sharedfolderref",
				plugins: [{
					ptype: "fieldinfo",
					text: _("The location of the Docker base path (this setting is optional and defaults to /var/lib/docker if unset). The plugin must be enabled for a change to be committed")
				}],
				allowNone: true,
				allowBlank: true
			}]
		},{
			xtype: "fieldset",
			title: _("Information"),
			fieldDefaults: {
				labelSeparator: ""
			},
			items: [{
				xtype: "textareafield",
				name: "versionInfo",
				readOnly: true,
				grow: true
			}]
		},{
			/*
xtype: "fieldset",
title: _("Image grid"),
fieldDefaults: {
labelSeparator: ""
},
items: [{
xtype: "checkbox",
name: "showDanglingImages",
boxLabel: _("Show dangling images"),
checked: false
}]
},{
*/
			xtype: "hiddenfield",
			name: "version"
		}];
	}

});

OMV.WorkspaceManager.registerPanel({
	id: "settings",
	path: "/service/docker",
	text: _("Settings"),
	position: 20,
	className: "OMV.module.admin.service.docker.Settings"
});
