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
			var installButton = settingsPanel.queryById("installDockerButton");
            var dockerVersion = settingsPanel.findField("version").getValue();
            if(dockerVersion === "0") {
				settingsPanel.findField("enabled").setValue(0);
			}
			var checked = settingsPanel.findField("enabled").getValue();

            if (overviewPanel) {
                if (checked) {
                    overviewPanel.tab.show();
                    overviewPanel.enable();
                } else {
                    overviewPanel.disable();
                    overviewPanel.tab.hide();
                }
				if (dockerVersion === "0") {
					settingsPanel.findField("enabled").setDisabled(true);
					settingsPanel.findField("apiPort").setDisabled(true);
					installButton.setHidden(false);
				} else {
					settingsPanel.findField("enabled").setDisabled(false);
					settingsPanel.findField("apiPort").setDisabled(false);
					installButton.setHidden(true);
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
				id: "installDockerButton",
				xtype: "button",
				text: "Install",
				icon: "images/download.png",
				tooltip: "Install Docker",
				iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
				handler: Ext.Function.bind(this.onInstallButton, this, [ this ]),
				scope: this
			},{
				xtype: "numberfield",
				anchor: '100%',
				maxValue: 65535,
				minValue: 0,
				name: "apiPort",
				allowBlank: false,
				plugins: [{
					ptype: "fieldinfo",
					text: _("Network port that the Docker API listens on")
				}],
				padding: "10 0 0 0",
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
	},

	onInstallButton: function() {
		Ext.create("OMV.window.Execute", {
			title          : "Install Docker",
			rpcService     : "Docker",
			rpcMethod      : "installDocker",
			hideStopButton : true,
			listeners      : {
				scope     : this,
				exception : function(wnd, error) {
					OMV.MessageBox.error(null, error);
				}
			}
		}).show();
	}
});

OMV.WorkspaceManager.registerPanel({
	id: "settings",
	path: "/service/docker",
	text: _("Settings"),
	position: 20,
	className: "OMV.module.admin.service.docker.Settings"
});
