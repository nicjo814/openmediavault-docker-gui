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
Ext.define("OMV.module.admin.service.docker.VolumesFromRow", {
    extend: "Ext.container.Container",
    alias: "widget.module.admin.service.docker.volumesfromrow",
    requires : [
        "OMV.workspace.window.plugin.ConfigObject"
    ],

    layout: "hbox",
    shadow: false,
    border: false,
    defaultType: "container",

    from: "",
    plugins: [{
        ptype : "configobject"
    }],
    uuid : OMV.UUID_UNDEFINED,
    volFromStore : [],

    initComponent: function() {
        var me = this;
        me.uuid = OMV.UUID_UNDEFINED;
        me.items = [{
            xtype: "combo",
            name: "volumesFrom-" + me.volCount,
            id: "volumesFrom-" + me.volCount,
            flex: 1,
            value: me.from,
            queryMode: "local",
            store: me.volFromStore,
            displayField: "name",
            valueField: "name",
            editable: false
        },{
            xtype: "button",
            id: "volumesFromAddButton-" + me.volCount,
            icon: "images/add.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            flex: 0,
            width: 24,
            listeners: {
                scope: this,
                click: function(button, e , eOpts) {
                    var errorMsg = me.validateData();
                    if(errorMsg === "") {
                        me.up('window').volumes[me.volCount] = {
                            from: me.queryById("volumesFrom-" + me.volCount).getValue()
                        };
                        var record = me.volFromStore.findRecord("name", me.queryById("volumesFrom-" + me.volCount).getValue());
                        me.volFromStore.remove(record);
                        var nextCount = parseInt(me.volCount)+1;
                        me.queryById("volumesFromAddButton-" + me.volCount).setHidden(true);
                        me.queryById("volumesFromDelButton-" + me.volCount).setHidden(false);
                        var newRow = Ext.create("OMV.module.admin.service.docker.VolumesFromRow", {
                            volCount: nextCount,
                            id: "volumesFromRow-" + nextCount,
                            volFromStore: me.volFromStore
                        });
                        Ext.getCmp("dockerVolumesFrom").add(newRow);
                        me.queryById("volumesFrom-" + me.volCount).setReadOnly(true);
                    } else {
                        Ext.Msg.alert(_("Bad input"), errorMsg);
                    }
                },
                setNewRow: function(button) {
                    var me = this;
                    var record = me.up('window').volFromStore.findRecord("name", me.queryById("volumesFrom-" + me.volCount).getValue());
                    me.up('window').volFromStore.remove(record);
                    me.up('window').volumes[me.volCount] = {
                        from: me.from
                    };
                    me.queryById("volumesFromAddButton-" + me.volCount).setHidden(true);
                    me.queryById("volumesFromDelButton-" + me.volCount).setHidden(false);
                    me.queryById("volumesFrom-" + me.volCount).setReadOnly(true);
                    me.up('window').volCount = me.volCount+1;
                }
            }
        },{
            xtype: "button",
            id: "volumesFromDelButton-" + me.volCount,
            icon: "images/delete.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            flex: 0,
            width: 24,
            hidden: true,
            listeners: {
                click: function(button, e , eOpts) {
                    var record = new me.volFromStore.model({name: me.up('window').volumes[me.volCount].from});
                    me.volFromStore.add(record);
                    delete me.up('window').volumes[me.volCount];
                    Ext.getCmp("dockerVolumesFrom").remove("volumesFromRow-" + me.volCount);
                }
            }
        }];
        Ext.apply(me, {
        });
        me.callParent(arguments);
    },

    validateData: function() {
        var me = this;
        var from = me.queryById("volumesFrom-" + me.volCount).getValue();

        var errorMsg = "";
        if (from === null) {
            errorMsg = errorMsg + "Volume must not be empty</br>";
        }
        return errorMsg;
    }
});
