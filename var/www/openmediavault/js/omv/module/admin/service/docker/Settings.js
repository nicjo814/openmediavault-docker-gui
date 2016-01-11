/**
 * Copyright (c) 2015 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/module/admin/service/docker/ImageGrid.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/form/field/SharedFolderComboBox.js")
// require("js/omv/window/RootFolderBrowser.js")
// require("js/omv/window/MessageBox.js")
// require("js/omv/Rpc.js")

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
            var me = this;
            this.uuid = OMV.UUID_UNDEFINED;
            var parent = this.up("tabpanel");

            if (!parent) {
                return;
            }

            var overviewPanel = parent.down("panel[title=" + _("Overview") + "]");
            var settingsPanel = parent.down("panel[title=" + _("Settings") + "]");
            var repoPanel = parent.down("panel[title=" + _("Docker images repo") + "]");
            var dockerVersion = settingsPanel.findField("version").getValue();
            var checked = settingsPanel.findField("enabled").checked
            settingsPanel.findField("destpath").setValue(settingsPanel.findField("sharedfolderref").getValue());
            var copyDisabled = true;
            if(!(settingsPanel.findField("orgpath").getValue() === "") && !(settingsPanel.findField("destpath").getValue() === "")) {
                copyDisabled = false;
            }
            settingsPanel.queryById("dockerCopyButton").setDisabled(copyDisabled);


            if (overviewPanel) {
                if (checked) {
                    overviewPanel.tab.show();
                    overviewPanel.enable();
                    overviewPanel.down("dockerImageGrid").doReload();
                    overviewPanel.down("dockerContainerGrid").doReload();
                    repoPanel.tab.show();
                    repoPanel.enable();
                    repoPanel.doReload();
                    parent.setActiveTab(overviewPanel);
                } else {
                    overviewPanel.disable();
                    overviewPanel.tab.hide();
                    repoPanel.disable();
                    repoPanel.tab.hide();
                    OMV.Rpc.request({
                        scope: me,
                        callback: function(id, success, response) {
                        },
                        relayErrors: false,
                        rpcData: {
                            service: "Docker",
                            method: "syncDockerLogos",
                        }
                    });
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
                allowBlank: true,
                listeners: {
                    scope: this,
                    change: function(combo, newValue, oldValue, eOpts) {
                        this.getForm().findField("destpath").setValue(newValue);
                    }
                }
            },{
                xtype: "container",
                layout: "hbox",
                padding: "0 0 10 0",
                items: [{
                    xtype: "textfield",
                    name: "orgpath",
                    flex: 1,
                    triggers: {
                        folder : {
                            cls     : Ext.baseCSSPrefix + "form-folder-trigger",
                            handler : "onTriggerClick"
                        }
                    },
                    onTriggerClick : function() {
                        Ext.create("OMV.window.RootFolderBrowser", {
                            listeners : {
                                scope  : this,
                                select : function(wnd, node, path) {
                                    // Set the selected path.
                                    this.setValue(path);
                                }
                            }
                        }).show();
                    },
                    plugins: [{
                        ptype: "fieldinfo",
                        text: _("Source path for copying of Docker image/container data")
                    }],
                    padding: "0 10 0 0",
                    listeners: {
                        scope: this,
                        change: function(field, newValue, oldValue, eOpts) {
                            if((newValue !== "") && (this.getForm().findField("destpath").getValue() !== "")) {
                                this.queryById("dockerCopyButton").setDisabled(false);
                            } else {
                                this.queryById("dockerCopyButton").setDisabled(true);
                            }
                        }
                    }
                },{
                    xtype: "sharedfoldercombo",
                    name: "destpath",
                    plugins: [{
                        ptype: "fieldinfo",
                        text: _("Destination path")
                    }],
                    allowNone: true,
                    allowBlank: true,
                    readOnly: true,
                    flex: 1,
                    listeners: {
                        scope: this,
                        change: function(combo, newValue, oldValue, eOpts) {
                            if((newValue !== "") && (this.getForm().findField("orgpath").getValue() !== "")) {
                                this.queryById("dockerCopyButton").setDisabled(false);
                            } else {
                                this.queryById("dockerCopyButton").setDisabled(true);
                            }
                        }
                    }
                },{
                    xtype: "button",
                    itemId: "dockerCopyButton",
                    icon: "images/docker_copy.png",
                    iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
                    flex: 0,
                    width: 24,
                    tooltip: _("Start copying of data"),
                    listeners: {
                        scope: this,
                        click: function(button, e , eOpts) {
                            OMV.Rpc.request({
                                scope: this,
                                callback: function(id, success, response) {
                                    OMV.MessageBox.show({
                                        title: _("Copy in progress"),
                                        msg: _("Copy operation is progressing in the background.<br />" +
                                               "Refresh overview tab to see the progress"),
                                        scope: me,
                                        buttons: Ext.Msg.OK
                                    });

                                },
                                relayErrors: false,
                                rpcData: {
                                    service: "Docker",
                                    method: "copyDockerData",
                                    params: {
                                        srcpath: this.getForm().findField("orgpath").getValue(),
                                        sharedfolderref: this.getForm().findField("destpath").getValue()
                                    }
                                }
                            });

                        }
                    }
                }]
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
