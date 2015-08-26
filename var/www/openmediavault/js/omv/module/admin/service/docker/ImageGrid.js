/**
* @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
* @author    Volker Theile <volker.theile@openmediavault.org>
* @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
* @copyright Copyright (c) 2009-2013 Volker Theile
* @copyright Copyright (c) 2014-2015 OpenMediaVault Plugin Developers
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

// require("js/omv/module/admin/service/docker/PortRow.js")
// require("js/omv/module/admin/service/docker/EnvVarRow.js")
// require("js/omv/module/admin/service/docker/BindMountRow.js")
// require("js/omv/module/admin/service/docker/PullImage.js")
// require("js/omv/module/admin/service/docker/RunContainer.js")
// require("js/omv/module/admin/service/docker/SearchBox.js")

Ext.define("OMV.module.admin.service.docker.ImageGrid", {
    extend: "OMV.workspace.grid.Panel",
    alias: "widget.dockerImageGrid",

    id: "dockerImageGrid",
    disableDeleteButton: true,
    deleteButtonText: _("Delete"),
    disablePullButton: false,
    pullButtonText: _("Pull Image"),
    disableRunButton: true,
    runButtonText: _("Run Image"),

    rpcService: "Docker",
    rpcGetMethod: "getImages",
    requires: [
        "OMV.data.Store",
        "OMV.data.Model",
        "OMV.data.proxy.Rpc",
        "OMV.module.admin.service.docker.PortRow",
        "OMV.module.admin.service.docker.EnvVarRow",
        "OMV.module.admin.service.docker.BindMountRow",
        "OMV.module.admin.service.docker.PullImage",
        "OMV.module.admin.service.docker.RunContainer"
    ],

    stateful: true,
    stateId: "24eb8cc1-3b30-48d0-9309-f278a3ad42fb",

    defaults: {
        flex: 1
    },

    columns: [{
        text: _("REPOSITORY"),
        dataIndex: 'repository',
        sortable: true,
        stateId: 'repository',
    },{
        text: _("TAG"),
        dataIndex: 'tag',
        sortable: true,
        stateId: 'tag',
    },{
        text: _("IMAGE ID"),
        dataIndex: 'id',
        sortable: true,
        stateId: 'id'
    },{
        text: _("CREATED"),
        dataIndex: 'created',
        sortable: true,
        stateId: 'created'
    },{
        text: _("VIRTUAL SIZE"),
        dataIndex: 'size',
        sortable: true,
        stateId: 'size	'
    }],

    initComponent: function() {
        var me = this;
        Ext.apply(me, {
            store: Ext.create("OMV.data.Store", {
                pageSize: 10,
                autoLoad: true,
                model: OMV.data.Model.createImplicit({
                    fields: [
                        { name: "repository", type: "string" },
                        { name: "tag", type: "string" },
                        { name: "id", type: "string" },
                        { name: "created", type: "string" },
                        { name: "size", type: "string" },
                        { name: "ports", type: "array" },
                        { name: "envvars", type: "array" }
                    ]
                }),
                proxy: {
                    type: "rpc",
                    rpcData: {
                        service: "Docker",
                        method: "getImages",
                    }
                }
            })
        });
        me.callParent(arguments);
    },

    getTopToolbarItems: function(c) {
        var me = this;

        var searchFilterStore = new Ext.data.ArrayStore({
            fields: [
                {name: "display", type: "string"},
                {name: "value", type: "string"}
            ]
        });

        var filterStoreData = [
            ["All", "all"],
            ["Trusted", "trusted"],
            ["Official", "official"],
            ["Trusted&Official", "trustedofficial"]
        ];

        searchFilterStore.loadData(filterStoreData, false);

        return [{
            id: me.getId() + "-pull",
            xtype: "button",
            text: me.pullButtonText,
            icon: "images/download.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled: me.disablePullButton,
            handler: Ext.Function.bind(me.onPullButton, me, [ me ]),
            scope: me
        },{
            id: me.getId() + "-run",
            xtype: "button",
            text: me.runButtonText,
            icon: "images/play.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled: me.disableRunButton,
            handler: Ext.Function.bind(me.onRunButton, me, [ me ]),
            scope: me
        },{
            id: me.getId() + "-details",
            xtype: "button",
            text: _("Details"),
            icon: "images/search.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled: true,
            handler: Ext.Function.bind(me.onDetailsButton, me, [ me ]),
            scope: me
        },{
            id: me.getId() + "-info",
            xtype: "button",
            text: _("Info"),
            icon: "images/about.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled: true,
            handler: Ext.Function.bind(me.onInfoButton, me, [ me ]),
            scope: me
        },{
            id: me.getId() + "-delete",
            xtype: "button",
            text: me.deleteButtonText,
            icon: "images/delete.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled: me.disableDeleteButton,
            handler: Ext.Function.bind(me.onDeleteButton, me, [ me ]),
            scope: me
        },{
            id: me.getId() + "-refresh",
            xtype: "button",
            text: _("Refresh"),
            icon: "images/refresh.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            hidden: false,
            handler: Ext.Function.bind(me.onRefreshButton, me, [ me ]),
            scope: me
        },'->',{
            xtype: 'box',
            autoEl: {tag: 'img', src:"images/search.png"}
        },{
            xtype: 'box',
            html: _("Search")
        },{
            xtype: "combo",
            name: "imageSearchFilter",
            id: "imageSearchFilter",
            store: searchFilterStore,
            queryMode: "local",
            width: 120,
            hidden: false,
            editable: false,
            displayField: 'display',
            valueField: 'value',
            triggerAction: "all",
            value: filterStoreData[0][0]
        },{
            xtype: "module.admin.service.docker.searchbox",
            name: "searchCombo",
            width: 350,
            text: _("Search"),
            hidden: false,
            displayField: 'name',
            valueField: 'name',
            pageSize: 10,

            listConfig: {
                loadingText: _('Searching...'),
                emptyText: _('No matching repositories found.'),

                // Custom rendering template for each item
                getInnerTpl: function() {
                    return '<div class="search-item">' +
                        '<h4><span>{name}</h4>{description}' +
                        '<br />stars: {stars}</span>' +
                        '</div>';
                }
            },
            // override default onSelect to open pull image dialog
            listeners: {
                select: function(combo, selection) {
                    var repo = selection.getData().name
                    if (repo) {
                        Ext.create("OMV.module.admin.service.docker.PullImage", {
                            title: _("Pull image"),
                            rpcService: "Docker",
                            rpcMethod: "pullImage",
                            repo: repo,
                            hideStopButton: true,
                            listeners: {
                                scope: me,
                                exception: function(wnd, error) {
                                    OMV.MessageBox.error(null, error);
                                }
                            }
                        }).show();
                    }
                }
            }
        }];
    },

    onSelectionChange: function(model, records) {
        var me = this;
        if(me.hideTopToolbar)
            return;
        var tbarBtnName = [ "pull", "run", "details", "info", "delete", "refresh" ];
        var tbarBtnDisabled = {
            "pull": false,
            "run": false,
            "details": false,
            "info": false,
            "delete": false,
            "refresh": false
        };
        // Enable/disable buttons depending on the number of selected rows.
        if(records.length <= 0) {
            tbarBtnDisabled["run"] = true;
            tbarBtnDisabled["details"] = true;
            tbarBtnDisabled["info"] = true;
            tbarBtnDisabled["delete"] = true;
        } else if(records.length == 1) {
            tbarBtnDisabled["run"] = false;
            tbarBtnDisabled["delete"] = false;
        } else {
            tbarBtnDisabled["run"] = true;
            tbarBtnDisabled["details"] = true;
            tbarBtnDisabled["info"] = true;
            tbarBtnDisabled["delete"] = false;
        }

        // Update the button controls.
        Ext.Array.each(tbarBtnName, function(name) {
            var tbarBtnCtrl = me.queryById(me.getId() + "-" + name);
            if(!Ext.isEmpty(tbarBtnCtrl)) {
                if(true == tbarBtnDisabled[name]) {
                    tbarBtnCtrl.disable();
                } else {
                    tbarBtnCtrl.enable();
                }
            }
        });
    },

    onPullButton : function() {
        var me = this;
        Ext.create("OMV.module.admin.service.docker.PullImage", {
            title          : _("Pull image"),
            rpcService     : "Docker",
            rpcMethod      : "pullImage",
            hideStopButton : true,
            listeners      : {
                scope     : me,
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    },

    doDeletion: function(record) {
        var me = this;
        OMV.Rpc.request({
            scope: me,
            callback: me.onDeletion,
            rpcData: {
                service: "Docker",
                method: "deleteImage",
                params: {
                    id: record.get('id')
                }
            }
        });
    },

    onRunButton: function() {
        var me = this;
        var sm = me.getSelectionModel();
        var records = sm.getSelection();
        var record = records[0];
        Ext.create("OMV.module.admin.service.docker.RunContainer", {
            title: _("Run image"),
            image: record.get("repository") + ":" + record.get("tag"),
            ports: record.get("ports"),
            envvars: record.get("envvars")
        }).show();
    },

    onDetailsButton: function() {
        var me = this;
        var sm = me.getSelectionModel();
        var records = sm.getSelection();
        var record = records[0];

        var detailsWindow = Ext.create("OMV.workspace.window.Form", {
            title: _("Image details"),
            rpcService: "Docker",
            rpcGetMethod: "getDetails",
            rpcGetParams: {
                id: record.get('id')
            },
            width: 800,
            height: 700,
            hideResetButton: true,
            hideCancelButton: true,
            okButtonText: _("Close"),
            scrollable: false,

            getFormItems: function() {
                var me = this;

                return [{
                    xtype: "textareafield",
                    name: "details",
                    grow: false,
                    height: 620,
                    readOnly: true,
                    fieldStyle: {
                        fontFamily: "courier",
                        fontSize: "12px"
                    }
                }];
            }
        }).show();
    },

    onInfoButton: function() {
        var me = this;
        var sm = me.getSelectionModel();
        var records = sm.getSelection();
        var record = records[0];
        window.open('https://hub.docker.com/r/' + record.get("repository"));
    }
});
