// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")

Ext.define("OMV.module.admin.service.docker.Settings", {
    extend: "OMV.workspace.form.Panel",
    
    rpcService: "Docker",
    rpcGetMethod: "getSettings",
    rpcSetMethod: "setSettings",
    
    getFormItems: function() {
        return [{
            xtype: "fieldset",
            title: _("General"),
            fieldDefaults: {
                labelSeparator: ""
            },
            items: [{
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
				fieldLabel: _("Show dangling"),
				checked: false,
				plugins: [{
					ptype: "fieldinfo",
					text: _("Check to show \"dangling\" images in the image grid")
				}],

			}]
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
