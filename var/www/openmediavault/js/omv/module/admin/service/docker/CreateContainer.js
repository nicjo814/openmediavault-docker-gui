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

// require("js/omv/workspace/window/Form.js")
// require("js/omv/Rpc.js")

Ext.define("OMV.module.admin.service.docker.CreateContainer", {
    extend: "OMV.workspace.window.Form",

    title: _("Create data container"),
    layout: "fit",
    width: 600,
    maxHeight: 700,
    closable: true,
    resizable: true,
    buttonAlign: "center",
    grow: true,

    rpcService   : "Docker",
    rpcSetMethod : "createContainer",

    //Some variables that are used
    imageStore: [],
    bindmounts: [],

    initComponent: function() {
        var me = this;
        //Initiate counters used to create id's
        me.bindCount = 1;
        me.bindMounts = [];
        me.callParent(arguments);
    },

    getFormItems : function() {
        var me = this;
        var items = [];

        //Add parameters fieldset
        items.push({
            xtype: "fieldset",
            title: _("Parameters"),
            items: [{
                xtype: "combo",
                name: "image",
                store: me.imageStore,
                editable: false,
                valueField: "repository",
                displayField: "repository",
                queryMode: "local",
                fieldLabel: _("Docker image"),
                allowBlank: false
            },{
                xtype: "textfield",
                fieldLabel: _("Container name"),
                name: "containerName"
            }]
        },{
            xtype: "fieldset",
            title: _("Volumes"),
            id: "dockerBindMounts",
            collapsible: true,
            padding: "0 10 10 10",
            items: [{
                xtype: "container",
                layout: "hbox",
                shadow: false,
                border: false,
                defaultType: "container",
                items: [{html: "Note that if the \"Container path\" field is left blank a new data volume will be created", flex: 1
                }]
            },{
                xtype: "container",
                layout: "hbox",
                shadow: false,
                border: false,
                defaultType: "container",
                items: [{html: "<b>Host path</b>", flex: 1},
                    {html: "<b>Container path</b>", flex: 1},
                    {html: " ", flex: 0, width: 24
                    }]
            }]
        });
        return items;

    },
    
    beforeRender: function() {
        var me = this;
        me.callParent(arguments);
        
        var bindMountsFieldset = me.queryById("dockerBindMounts");
        bindMountsFieldset.add({
            xtype: "module.admin.service.docker.bindmountrow",
            bindCount: me.bindCount,
            id: "bindMountRow-" + me.bindCount
        });
    },

    doSubmit: function() {
        var me = this;
        var params = {
            imageRepo: me.getForm().findField("image").getValue(),
            containerName: me.getForm().findField("containerName").getValue(),
            bindMounts: me.bindMounts
        };
        if(me.mode === "remote") {
            var rpcOptions = {
                scope: me,
                callback: me.onSubmit,
                relayErrors: true,
                rpcData: {
                    service: me.rpcService,
                    method: me.rpcSetMethod || "set",
                    params: params
                }
            };
            if(me.fireEvent("beforesubmit", me, rpcOptions) === false)
                return;
            // Display waiting dialog.
            me.mask(me.submitMsg);
            // Execute RPC.
            OMV.Rpc.request(rpcOptions);
        } else {
            var params = me.getRpcSetParams();
            me.fireEvent("submit", me, params);
            me.close();
        }
    },

    onSubmit: function(id, success, response) {
        var me = this;
        // Is this a long running RPC? If yes, then periodically check
        // if it is still running, otherwise we are finished here and
        // we can notify listeners and close the window.
        if(me.rpcSetPollStatus) {
            if(!success) {
                me.unmask();
                OMV.MessageBox.error(null, response);
                me.fireEvent("exception", me, response);
                return;
            }
            // Execute RPC.
            OMV.Rpc.request({
                scope: me,
                callback: me.onIsRunning,
                relayErrors: true,
                rpcData: {
                    service: "Exec",
                    method: "isRunning",
                    params: {
                        filename: response
                    }
                }
            });
        } else {
            me.unmask();
            if(success) {
                var values = me.getRpcSetParams();
                me.fireEvent("submit", me, values, response);
                me.close();
                Ext.getCmp("dockerContainerGrid").doReload();
            } else {
                OMV.MessageBox.error(null, response);
                me.fireEvent("exception", me, response);
            }
        }
    }
});

