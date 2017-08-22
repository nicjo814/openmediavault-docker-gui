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

// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omvextras/window/RootFolderBrowser.js")

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
    imagevolumes: [],
    mode: "rw",
    plugins: [{
        ptype : "configobject"
    }],
    uuid : OMV.UUID_UNDEFINED,

    initComponent: function() {
        var me = this;
        me.uuid = OMV.UUID_UNDEFINED;
        var volumeStore = new Ext.data.ArrayStore({
            fields: [
                {name: "value", type: "string"}
            ]
        });
        volumeStore.loadData(me.imagevolumes, false);

        if (me.mode === "rw") {
            me.romode = false
        } else {
            me.romode = true
        }

        me.items = [{
            xtype: "textfield",
            name: "bindMountFrom-" + me.bindCount,
            id: "bindMountFrom-" + me.bindCount,
            flex: 6,
            value: me.from,
            triggers       : {
                folder : {
                    cls     : Ext.baseCSSPrefix + "form-folder-trigger",
                    handler : "onTriggerClick"
                }
            },
            onTriggerClick : function() {
                Ext.create("OmvExtras.window.RootFolderBrowser", {
                    listeners : {
                        scope  : this,
                        select : function(wnd, node, path) {
                            // Set the selected path.
                            this.setValue(path);
                        }
                    }
                }).show();
            },
            listeners : {
                afterrender: function(field, eOpts) {
                    field.getEl().down('input').set({'data-qtip': field.getValue()});
                }
            }
        },{
            xtype: "combo",
            name: "bindMountTo-" + me.bindCount,
            id: "bindMountTo-" + me.bindCount,
            flex: 6,
            minChars: 0,
            typeAhead: true,
            hideTrigger: true,
            store: volumeStore,
            queryMode: 'local',
            displayField: 'value',
            valueField: 'value',
            value: me.to,
            listeners : {
                afterrender: function(field, eOpts) {
                    field.getEl().down('input').set({'data-qtip': field.getValue()});
                }
            }
        },{
            xtype: "checkbox",
            name: "roMode-" + me.bindCount,
            id: "roMode-" + me.bindCount,
            value: me.romode,
            flex: 1
        },{
            xtype: "button",
            id: "bindMountAddButton-" + me.bindCount,
            icon: "images/add.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            width: 32,
            height: 32,
            flex: 0,
            tooltip: {
                text: _("Add"),
                anchor: "top"
            },
            listeners: {
                scope: this,
                click: function(button, e , eOpts) {
                    var errorMsg = me.validateData();
                    if(errorMsg === "") {
                        me.up('window').bindMounts[me.bindCount] = {
                            from: me.queryById("bindMountFrom-" + me.bindCount).getValue(),
                            to: me.queryById("bindMountTo-" + me.bindCount).getValue(),
                            romode: me.queryById("roMode-" + me.bindCount).getValue()
                        };
                        var nextCount = parseInt(me.bindCount)+1;
                        me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
                        me.queryById("bindMountDelButton-" + me.bindCount).setHidden(false);
                        me.queryById("bindMountEditButton-" + me.bindCount).setHidden(false);
                        me.queryById("bindMountBlankButton-" + me.bindCount).setHidden(true);
                        var newRow = Ext.create("OMV.module.admin.service.docker.BindMountRow", {
                            bindCount: nextCount,
                            id: "bindMountRow-" + nextCount,
                            imagevolumes: me.imagevolumes
                        });
                        Ext.getCmp("dockerBindMounts").add(newRow);
                        me.queryById("bindMountFrom-" + me.bindCount).getEl().down('input').set({'data-qtip': me.queryById("bindMountFrom-" + me.bindCount).getValue()});
                        me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
                        me.queryById("bindMountTo-" + me.bindCount).getEl().down('input').set({'data-qtip': me.queryById("bindMountTo-" + me.bindCount).getValue()});
                        me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
                        me.queryById("roMode-" + me.bindCount).setReadOnly(true);
                    } else {
                        Ext.Msg.alert(_("Bad input"), errorMsg);
                    }
                },
                setNewRow: function(button) {
                    var me = this;
                    me.up('window').bindMounts[me.bindCount] = {
                        from: me.from,
                        to: me.to,
                        romode: me.romode
                    };
                    me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
                    me.queryById("bindMountDelButton-" + me.bindCount).setHidden(false);
                    me.queryById("bindMountEditButton-" + me.bindCount).setHidden(false);
                    me.queryById("bindMountBlankButton-" + me.bindCount).setHidden(true);
                    me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
                    me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
                    me.queryById("roMode-" + me.bindCount).setReadOnly(true);
                    me.up('window').bindCount = me.bindCount+1;
                }
            }
        },{
            xtype: "button",
            id: "bindMountEditButton-" + me.bindCount,
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
                    me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
                    me.queryById("bindMountDelButton-" + me.bindCount).setHidden(true);
                    me.queryById("bindMountEditButton-" + me.bindCount).setHidden(true);
                    me.queryById("bindMountCommitButton-" + me.bindCount).setHidden(false);
                    me.queryById("bindMountUndoButton-" + me.bindCount).setHidden(false);

                    me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(false);
                    me.queryById("bindMountTo-" + me.bindCount).setReadOnly(false);
                    me.queryById("roMode-" + me.bindCount).setReadOnly(false);
                }
            }
        },{
            xtype: "button",
            id: "bindMountCommitButton-" + me.bindCount,
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
                        me.up('window').bindMounts[me.bindCount] = {
                            from: me.queryById("bindMountFrom-" + me.bindCount).getValue(),
                            to: me.queryById("bindMountTo-" + me.bindCount).getValue(),
                            romode: me.queryById("roMode-" + me.bindCount).getValue()
                        };
                        me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
                        me.queryById("bindMountDelButton-" + me.bindCount).setHidden(false);
                        me.queryById("bindMountEditButton-" + me.bindCount).setHidden(false);
                        me.queryById("bindMountCommitButton-" + me.bindCount).setHidden(true);
                        me.queryById("bindMountUndoButton-" + me.bindCount).setHidden(true);

                        me.queryById("bindMountFrom-" + me.bindCount).getEl().down('input').set({'data-qtip': me.queryById("bindMountFrom-" + me.bindCount).getValue()});
                        me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
                        me.queryById("bindMountTo-" + me.bindCount).getEl().down('input').set({'data-qtip': me.queryById("bindMountTo-" + me.bindCount).getValue()});
                        me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
                        me.queryById("roMode-" + me.bindCount).setReadOnly(true);
                    } else {
                        Ext.Msg.alert(_("Bad input"), errorMsg);
                    }
                }
            }
        },{
            xtype: "button",
            id: "bindMountUndoButton-" + me.bindCount,
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
                    me.queryById("bindMountFrom-" + me.bindCount).setValue(me.up('window').bindMounts[me.bindCount]["from"]);
                    me.queryById("bindMountTo-" + me.bindCount).setValue(me.up('window').bindMounts[me.bindCount]["to"]);
                    me.queryById("roMode-" + me.bindCount).setValue(me.up('window').bindMounts[me.bindCount]["romode"]);

                    me.queryById("bindMountFrom-" + me.bindCount).setReadOnly(true);
                    me.queryById("bindMountTo-" + me.bindCount).setReadOnly(true);
                    me.queryById("roMode-" + me.bindCount).setReadOnly(true);

                    me.queryById("bindMountAddButton-" + me.bindCount).setHidden(true);
                    me.queryById("bindMountDelButton-" + me.bindCount).setHidden(false);
                    me.queryById("bindMountEditButton-" + me.bindCount).setHidden(false);
                    me.queryById("bindMountCommitButton-" + me.bindCount).setHidden(true);
                    me.queryById("bindMountUndoButton-" + me.bindCount).setHidden(true);
                }
            }
        },{
            xtype: "button",
            id: "bindMountDelButton-" + me.bindCount,
            icon: "images/delete.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            width: 32,
            height: 32,
            flex: 0,
            hidden: true,
            tooltip: {
                text: _("Delete"),
                anchor: "top"
            },
            listeners: {
                click: function(button, e , eOpts) {
                    delete me.up('window').bindMounts[me.bindCount];
                    Ext.getCmp("dockerBindMounts").remove("bindMountRow-" + me.bindCount);
                }
            }
        },{
            xtype: "image",
            id: "bindMountBlankButton-" + me.bindCount,
            src: "images/docker_blank.png",
            width: 32,
            height: 32,
            flex: 0,
            hidden: false
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
