/**
 * Copyright (c) 2015-2017 OpenMediaVault Plugin Developers
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

Ext.define("OMV.module.admin.service.docker.DisconnectNetwork", {
    extend: "OMV.workspace.window.Form",

    title: _("Disconnect network"),
    layout: "fit",
    width: 650,
    maxHeight: 700,
    closable: true,
    resizable: true,
    buttonAlign: "center",
    grow: true,

    rpcService   : "Docker",
    rpcSetMethod : "disconnectNetwork",

    //Some variables that are used
    driver: "",

    initComponent: function() {
        var me = this;
        me.callParent(arguments);
    },

    getFormItems : function() {
        var me = this;
        var items = [];

        //Create data store for network mode selection
        var drivers = Ext.create('Ext.data.Store', {
            fields: ['driver'],
            data : [
                {"driver": "macvlan"}
            ]
        });

        //Add general fieldset
        items.push({
            xtype: "fieldset",
            title: _("General"),
            items: [{
                xtype: "textfield",
                fieldLabel: _("Docker Network"),
                value: me.name,
                readOnly: true,
                name: "name",
                id: "dockerNetworkName"
            },{
                xtype: "tagfield",
                fieldLabel: _("Container"),
                name: "containerName",
                id: "containerName",
                displayField: "name",
                emptyText: _("Select a container..."),
                store: Ext.create("OMV.data.Store", {
                    // autoLoad: true,
                    model: OMV.data.Model.createImplicit({
                        fields: [
                            { name: "name", type: "string" },
                            { state: "state", type: "string" }
                        ]
                    }),
                    proxy: {
                        type: "rpc",
                        rpcData: {
                            service: "Docker",
                            method: "getContainersInSelectedNetwork",
                            params: {
                                selectednetwork: me.name
                            }
                        }
                    },
                }),
            }]
        });


        return items;

    },

    doSubmit: function() {
        var me = this;
        var params = {
            networkname: me.getForm().findField("dockerNetworkName").getValue(),
            containername: me.getForm().findField("containerName").getValue(),
        };
        //params.toString();
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
                Ext.getCmp("dockerNetworksGrid").doReload();
            } else {
                OMV.MessageBox.error(null, response);
                me.fireEvent("exception", me, response);
            }
        }
    }


});
