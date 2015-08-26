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

Ext.define("OMV.module.admin.service.docker.PortRow", {
    extend: "Ext.container.Container",
    alias: "widget.module.admin.service.docker.portrow",

    layout: "hbox",
    shadow: false,
    border: false,
    defaultType: "container",
    defaults: {
        flex: 2
    },

    hostip: "0.0.0.0",
    hostport: "",
    exposedport: "Select",
    customport: "",

    initComponent: function() {
        var me = this;
        me.items = [{
            xtype: "textfield",
            name: "hostip-" + me.portCount,
            value: "0.0.0.0",
            id: "hostip-" + me.portCount,
            value: me.hostip
        },{
            xtype: "textfield",
            name: "hostport-" + me.portCount,
            id: "hostport-" + me.portCount,
            value: me.hostport
        },{
            xtype: "combo",
            name: "exposedPort-" + me.portCount,
            id: "exposedPort-" + me.portCount,
            store: me.exposedPorts,
            queryMode: 'local',
            displayField: 'name',
            valueField: 'name',
            value: me.exposedport,
            editable: false,
            listeners: {
                scope: me,
                change: function(combo, newValue, oldValue, eOpts) {
                    me.queryById("customPort-" + me.portCount).setValue("");
                }
            }
        },{
            xtype: "textfield",
            name: "customPort-" + me.portCount,
            id: "customPort-" + me.portCount,
            value: me.customport,
            listeners: {
                scope: me,
                change: function(combo, newValue, oldValue, eOpts) {
                    if(newValue === "") {
                        me.queryById("exposedPort-" + me.portCount).setDisabled(false);
                    } else {
                        me.queryById("exposedPort-" + me.portCount).setValue("Select");
                        me.queryById("exposedPort-" + me.portCount).setDisabled(true);
                        me.queryById("customPort-" + me.portCount).setValue(newValue);
                    }
                }
            }

        },{
            xtype: "button",
            id: "portForwardAddButton-" + me.portCount,
            icon: "images/add.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            width: 24,
            flex: 0,
            listeners: {
                scope: this,
                click: function(button, e , eOpts) {
                    var errorMsg = me.validateData();
                    if(errorMsg === "") {
                        me.up('window').portForwards[me.portCount] = {
                            hostip: me.queryById("hostip-" + me.portCount).getValue(),
                            hostport: me.queryById("hostport-" + me.portCount).getValue(),
                            exposedPort: me.queryById("exposedPort-" + me.portCount).getValue(),
                            customPort: me.queryById("customPort-" + me.portCount).getValue()
                        };
                        var nextCount = parseInt(me.portCount)+1;
                        me.queryById("portForwardAddButton-" + me.portCount).setHidden(true);
                        me.queryById("portForwardDelButton-" + me.portCount).setHidden(false);
                        var newRow = Ext.create("OMV.module.admin.service.docker.PortRow", {
                            portCount: nextCount,
                            id: "dockerPortForward-" + nextCount,
                            exposedPorts: me.exposedPorts
                        });
                        Ext.getCmp("dockerPortForward").add(newRow);
                        me.queryById("hostip-" + me.portCount).setReadOnly(true);
                        me.queryById("hostport-" + me.portCount).setReadOnly(true);
                        me.queryById("exposedPort-" + me.portCount).setReadOnly(true);
                        me.queryById("customPort-" + me.portCount).setReadOnly(true);
                    } else {
                        Ext.Msg.alert(_("Bad input"), errorMsg);
                    }
                },
                setNewRow: function() {
                    var me = this;
                    me.up('window').portForwards[me.portCount] = {
                        hostip: me.hostip,
                        hostport: me.hostport,
                        exposedPort: me.exposedport,
                        customPort: me.customport
                    };
                    me.queryById("portForwardAddButton-" + me.portCount).setHidden(true);
                    me.queryById("portForwardDelButton-" + me.portCount).setHidden(false);
                    me.queryById("hostip-" + me.portCount).setReadOnly(true);
                    me.queryById("hostport-" + me.portCount).setReadOnly(true);
                    me.queryById("exposedPort-" + me.portCount).setReadOnly(true);
                    me.queryById("customPort-" + me.portCount).setReadOnly(true);
                    me.up('window').portCount = me.portCount+1;
                }
            }
        },{
            xtype: "button",
            id: "portForwardDelButton-" + me.portCount,
            icon: "images/delete.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            width: 24,
            flex: 0,
            hidden: true,
            listeners: {
                scope: me,
                click: function(button, e , eOpts) {
                    delete me.up('window').portForwards[me.portCount];
                    Ext.getCmp("dockerPortForward").remove("dockerPortForward-" + me.portCount);
                }
            }
        }];
        Ext.apply(me, {
        });
        me.callParent(arguments);
    },

    validateData: function() {
        var me = this;
        var hostip = me.queryById("hostip-" + me.portCount).getValue();
        var hostport = me.queryById("hostport-" + me.portCount).getValue();
        var exposedport = me.queryById("exposedPort-" + me.portCount).getValue();
        var customport = me.queryById("customPort-" + me.portCount).getValue();
        var errorMsg = "";
        if (!(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(hostip))) {
            errorMsg = errorMsg + "Illegal host ip supplied</br>";
        }
        if(isNaN(hostport) || hostport > 65535 || hostport === "" || hostport < 1) {
            errorMsg = errorMsg + "Illegal host port supplied</br>";
        }
        if(exposedport === "Select" && customport === "") {
            errorMsg = errorMsg + "Either an exposed port, or a custom port must be specified</br>";
        }
        if(customport !== "" && (isNaN(customport) || customport > 65535 || customport < 1)) {
            errorMsg = errorMsg + "Illegal custom port supplied</br>";
        }
        return errorMsg;
    }
});
