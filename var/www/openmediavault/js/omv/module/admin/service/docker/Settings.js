// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")

Ext.define("OMV.module.admin.service.docker.Settings", {
    extend: "OMV.workspace.form.Panel",
    
    rpcService: "Docker",
    rpcGetMethod: "getSettings",
    rpcSetMethod: "setSettings",
    
    initComponent : function() {
        this.on("load", function () {
            var parent = this.up("tabpanel");
			
            if (!parent) {
                return;
            }

            var overviewPanel = parent.down("panel[title=" + _("Overview") + "]");
            var settingsPanel = parent.down("panel[title=" + _("Settings") + "]");
            var checked = settingsPanel.findField("enabled").checked;

            if (overviewPanel) {
                if (checked) {
                    overviewPanel.enable();
                    overviewPanel.tab.show();
                } else {
                    overviewPanel.disable();
                    overviewPanel.tab.hide();
                }
			}
		}, this);

		this.callParent(arguments);
	},

    getFormItems: function() {
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
				fieldLabel: _("API port"),
				allowBlank: false,
				plugins: [{
					ptype: "fieldinfo",
					text: _("Network port that the Docker API listens on")
				}],
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
			}]
		},{
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
