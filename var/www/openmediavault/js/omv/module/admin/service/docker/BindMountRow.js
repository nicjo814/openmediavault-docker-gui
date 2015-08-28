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

// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/module/admin/service/docker/RootFolderBrowser.js")
Ext.define("OMV.module.admin.service.docker.BindMountRow", {
    extend: "Ext.container.Container",
    alias: "widget.module.admin.service.docker.bindmountrow",
    requires : [
        "OMV.workspace.window.plugin.ConfigObject"
    ],

    layout: "hbox",
    shadow: false,
    border: false,
    defaultType: "container",

    from: "",
    to: "",
    plugins: [{
        ptype : "configobject"
    }],
    uuid : OMV.UUID_UNDEFINED,

    initComponent: function() {
        var me = this;
        me.uuid = OMV.UUID_UNDEFINED;
        me.items = [{
            xtype: "textfield",
            name: "bindMountFrom-" + me.bindCount,
            id: "bindMountFrom-" + me.bindCount,
            flex: 1,
            value: me.from,
            triggers       : {
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
            }
        },{
            xtype: "textfield",
            name: "bindMountTo-" + me.bindCount,
            id: "bindMountTo-" + me.bindCount,
            flex: 1,
            value: me.to
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
                    var errorMsg = me.validateData();
                    if(errorMsg === "") {
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
                        Ext.Msg.alert(_("Bad input"), errorMsg);
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
    },

    validateData: function() {
        var me = this;
        var from = me.queryById("bindMountFrom-" + me.bindCount).getValue();
        var to = me.queryById("bindMountTo-" + me.bindCount).getValue();

        var errorMsg = "";
        if (from === "") {
            errorMsg = errorMsg + "Host path must not be empty</br>";
        }
        return errorMsg;
    }
});
