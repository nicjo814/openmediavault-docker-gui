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
            title: _("Image grid"),
            fieldDefaults: {
                labelSeparator: ""
            },
            items: [{
                xtype: "checkbox",
                name: "showDanglingImages",
                fieldLabel: _("Show dangling"),
                checked: false
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
