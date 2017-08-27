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

Ext.define("OMV.module.admin.service.docker.EnvVarRow", {
    extend: "Ext.container.Container",
    alias: "widget.module.admin.service.docker.envvarrow",

    layout: "hbox",
    shadow: false,
    border: false,
    defaultType: "container",
    nameVal: "",
    valueVal: "",
    defaultVal: "false",

    initComponent: function() {
        var me = this;
        var defVal;
        if(me.defaultVal === "true") {
            defVal = true;
        } else {
            defVal = false;
        }

        me.items = [{
            xtype: "textfield",
            name: "envName-" + me.envCount,
            id: "envName-" + me.envCount,
            value: me.nameVal,
            flex: 1,
            readOnly: defVal,
            listeners : {
                afterrender: function(field, eOpts) {
                    field.getEl().down('input').set({'data-qtip': field.getValue()});
                }
            }
        },{
            xtype: "textfield",
            name: "envValue-" + me.envCount,
            id: "envValue-" + me.envCount,
            value: me.valueVal,
            flex: 2,
            readOnly: defVal,
            listeners : {
                afterrender: function(field, eOpts) {
                    field.getEl().down('input').set({'data-qtip': field.getValue()});
                }
            }
        },{
            xtype: "button",
            id: "envVarAddButton-" + me.envCount,
            icon: "images/add.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            flex: 0,
            width: 32,
            height: 32,
            hidden: defVal,
            tooltip: {
                text: _("Add"),
                anchor: "top"
            },
            listeners: {
                scope: this,
                click: function(button, e , eOpts) {
                    var errorMsg = me.validateData();
                    if(errorMsg === "") {
                        me.up('window').envVars[me.envCount] = {
                            name: me.queryById("envName-" + me.envCount).getValue(),
                            value: me.queryById("envValue-" + me.envCount).getValue()
                        };
                        var nextCount = parseInt(me.envCount)+1;
                        button.setHidden(true);
                        me.queryById("envVarDelButton-" + me.envCount).setHidden(false);
                        me.queryById("envVarEditButton-" + me.envCount).setHidden(false);
                        me.queryById("envVarBlankButton-" + me.envCount).setHidden(true);
                        var newRow = Ext.create("OMV.module.admin.service.docker.EnvVarRow", {
                            envCount: nextCount,
                            id: "envVarRow-" + nextCount
                        });
                        Ext.getCmp("dockerEnvVars").add(newRow);
                        me.queryById("envName-" + me.envCount).getEl().down('input').set({'data-qtip': me.queryById("envName-" + me.envCount).getValue()});
                        me.queryById("envName-" + me.envCount).setReadOnly(true);
                        me.queryById("envValue-" + me.envCount).getEl().down('input').set({'data-qtip': me.queryById("envValue-" + me.envCount).getValue()});
                        me.queryById("envValue-" + me.envCount).setReadOnly(true);
                    } else {
                        Ext.Msg.alert(_("Bad input"), errorMsg);
                    }
                },
                setNewRow: function() {
                    var me = this;
                    me.up('window').envVars[me.envCount] = {
                        name: me.nameVal,
                        value: me.valueVal
                    };
                    me.queryById("envVarAddButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarDelButton-" + me.envCount).setHidden(false);
                    me.queryById("envVarDelButton-" + me.envCount).setDisabled(defVal);
                    me.queryById("envVarEditButton-" + me.envCount).setHidden(false);
                    me.queryById("envVarCommitButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarUndoButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarBlankButton-" + me.envCount).setHidden(true);
                    me.queryById("envName-" + me.envCount).setReadOnly(true);
                    me.queryById("envValue-" + me.envCount).setReadOnly(true);
                    me.up('window').envCount = me.envCount+1;
                }
            }
        },{
            xtype: "button",
            id: "envVarEditButton-" + me.envCount,
            icon: "images/edit.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            width: 32,
            height: 32,
            flex: 0,
            hidden: true,
            tooltip: {
                text: _("Edit"),
                anchor: "top"
            },
            listeners: {
                scope: me,
                click: function(button, e , eOpts) {
                    me.queryById("envVarAddButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarDelButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarEditButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarCommitButton-" + me.envCount).setHidden(false);
                    me.queryById("envVarUndoButton-" + me.envCount).setHidden(false);

                    me.queryById("envName-" + me.envCount).setReadOnly(false);
                    me.queryById("envValue-" + me.envCount).setReadOnly(false);
                }
            }
        },{
            xtype: "button",
            id: "envVarCommitButton-" + me.envCount,
            icon: "images/checkmark.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            width: 32,
            height: 32,
            flex: 0,
            hidden: true,
            tooltip: {
                text: _("Commit"),
                anchor: "top"
            },
            listeners: {
                scope: me,
                click: function(button, e , eOpts) {
                    var errorMsg = me.validateData();
                    if(errorMsg === "") {
                        me.up('window').envVars[me.envCount] = {
                            name: me.queryById("envName-" + me.envCount).getValue(),
                            value: me.queryById("envValue-" + me.envCount).getValue()
                        };
                        me.queryById("envVarAddButton-" + me.envCount).setHidden(true);
                        me.queryById("envVarDelButton-" + me.envCount).setHidden(false);
                        me.queryById("envVarEditButton-" + me.envCount).setHidden(false);
                        me.queryById("envVarCommitButton-" + me.envCount).setHidden(true);
                        me.queryById("envVarUndoButton-" + me.envCount).setHidden(true);

                        me.queryById("envName-" + me.envCount).getEl().down('input').set({'data-qtip': me.queryById("envName-" + me.envCount).getValue()});
                        me.queryById("envName-" + me.envCount).setReadOnly(true);
                        me.queryById("envValue-" + me.envCount).getEl().down('input').set({'data-qtip': me.queryById("envValue-" + me.envCount).getValue()});
                        me.queryById("envValue-" + me.envCount).setReadOnly(true);
                    } else {
                        Ext.Msg.alert(_("Bad input"), errorMsg);
                    }
                }
            }
        },{
            xtype: "button",
            id: "envVarUndoButton-" + me.envCount,
            icon: "images/undo.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            width: 32,
            height: 32,
            flex: 0,
            hidden: true,
            tooltip: {
                text: _("Undo"),
                anchor: "top"
            },
            listeners: {
                scope: me,
                click: function(button, e , eOpts) {
                    me.queryById("envName-" + me.envCount).setValue(me.up('window').envVars[me.envCount]["name"]);
                    me.queryById("envValue-" + me.envCount).setValue(me.up('window').envVars[me.envCount]["value"]);

                    me.queryById("envName-" + me.envCount).setReadOnly(true);
                    me.queryById("envValue-" + me.envCount).setReadOnly(true);

                    me.queryById("envVarAddButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarDelButton-" + me.envCount).setHidden(false);
                    me.queryById("envVarEditButton-" + me.envCount).setHidden(false);
                    me.queryById("envVarCommitButton-" + me.envCount).setHidden(true);
                    me.queryById("envVarUndoButton-" + me.envCount).setHidden(true);
                }
            }
        },{
            xtype: "button",
            id: "envVarDelButton-" + me.envCount,
            icon: "images/delete.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            flex: 0,
            width: 32,
            height: 32,
            hidden: !defVal,
            disabled: defVal,
            tooltip: {
                text: _("Delete"),
                anchor: "top"
            },
            listeners: {
                scope: me,
                click: function(button, e , eOpts) {
                    delete me.up('window').envVars[me.envCount];
                    Ext.getCmp("dockerEnvVars").remove("envVarRow-" + me.envCount);
                }
            }
        },{
            xtype: "image",
            id: "envVarBlankButton-" + me.envCount,
            src: "images/docker_blank.png",
            width: 32,
            height: 32,
            flex: 0,
            hidden: false
        },{
            xtype: "hiddenfield",
            name: "envVarDefault-" + me.envCount,
            id: "envVarDefault-" + me.envCount,
            value: me.defaultVal
        }];
        Ext.apply(me, {
        });
        me.callParent(arguments);
    },

    validateData: function() {
        var me = this;
        var name = me.queryById("envName-" + me.envCount).getValue();
        var errorMsg = "";
        if (!(/^[a-zA-Z_]+[a-zA-Z0-9_]*$/.test(name))) {
            errorMsg = errorMsg + "Invalid name supplied";
        }
        return errorMsg;
    }
});
