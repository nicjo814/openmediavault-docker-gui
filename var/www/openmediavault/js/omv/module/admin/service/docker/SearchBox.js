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

// require("js/omv/Rpc.js")

Ext.define("OMV.module.admin.service.docker.SearchBox", {
    extend: "Ext.form.field.ComboBox",

    alias: "widget.module.admin.service.docker.searchbox",

    queryMode: 'local',
    displayField: 'name',
    valueField: 'name',
    triggerAction:'all',
    typeAhead: false,
    hideTrigger:true,

    initComponent: function() {
        var me = this;

        //Create data store for selection of filesystem path
        var store = Ext.create('Ext.data.Store', {
            fields: [
                {name: "name", type: "string"},
                {name: "description" , type: "string"},
                {name: "stars", type: "integer"}
            ]
        });
        me.setStore(store);
        me.callParent(arguments);
    },

    onChange: function(box, newValue, oldValue, eOpts) {
        var me = this;
        if(this.getValue() !== null && this.getValue().length > 2) {

            OMV.Rpc.request({
                scope: this,
                callback: function(id, success, response) {
                    this.getStore().removeAll();
                    this.getStore().loadData(response);
                },
                relayErrors: false,
                rpcData: {
                    service: "Docker",
                    method: "searchImages",
                    params: {
                        name: this.getValue(),
                        filterParam: Ext.getCmp("imageSearchFilter").getValue()
                    }
                }
            });
        }
        me.callParent(arguments);
    }
});

