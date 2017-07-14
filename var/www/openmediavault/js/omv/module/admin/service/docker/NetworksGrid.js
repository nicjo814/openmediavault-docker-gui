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

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/window/MessageBox.js")
// require("js/omv/Rpc.js")
// require("js/omv/module/admin/service/docker/CreateNetwork.js")

Ext.define("OMV.module.admin.service.docker.NetworksGrid", {
  extend: "OMV.workspace.grid.Panel",
  alias: "widget.dockerNetworksGrid",
  plugins: "gridfilters",

  id: "dockerNetworksGrid",
  disableDeleteButton: true,
  deleteButtonText: _("Delete"),

  rpcService: "Docker",
  rpcGetMethod: "getNetworks",
  requires: [
    "OMV.data.Store",
    "OMV.data.Model",
    "OMV.data.proxy.Rpc",
  ],

  stateful: true,
  stateId: "48189a83-85e4-40d4-a9fe-862e45b57787",

  defaults: {
    flex: 1
  },

  columns: [{
    xtype: "textcolumn",
    text: _("ID"),
    dataIndex: 'id',
    sortable: true,
    stateId: 'id',
  },{
    xtype: "textcolumn",
    text: _("NAME"),
    dataIndex: 'name',
    sortable: true,
    stateId: 'name',
  },{
    xtype: "textcolumn",
    text: _("DRIVER"),
    dataIndex: 'driver',
    sortable: true,
    stateId: 'driver',
  },{
    xtype: "textcolumn",
    text: _("SCOPE"),
    dataIndex: 'scope',
    sortable: true,
    stateId: 'scope',
  }],

  initComponent: function() {
    var me = this;
    Ext.apply(me, {
      store: Ext.create("OMV.data.Store", {
        autoLoad: true,
        model: OMV.data.Model.createImplicit({
          fields: [
            { name: "id", type: "string" },
            { name: "name", type: "string" },
            { name: "driver", type: "string" },
            { name: "scope", type: "string" }
          ]
        }),
        proxy: {
          type: "rpc",
          rpcData: {
            service: "Docker",
            method: "getNetworks",
          }
        }
      })
    });
    me.callParent(arguments);
  },

  getTopToolbarItems: function(c) {
    var me = this;
    return [{
      id: me.getId() + "-create",
      xtype: "button",
      text: _("Create"),
      icon: "images/add.png",
      iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
      disabled: false,
      handler: Ext.Function.bind(me.onCreateButton, me, [ me ]),
      scope: me
    },{
      id: me.getId() + "-delete",
      xtype: "button",
      text: _("Delete"),
      icon: "images/delete.png",
      iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
      disabled: true,
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
    }]
  },

  onSelectionChange: function(model, records) {
    var me = this;
    if(me.hideTopToolbar)
    return;
    var tbarBtnName = [ "create", "delete", "refresh" ];
    var tbarBtnDisabled = {
      "create": false,
      "delete": false,
      "refresh": false
    };
    // Enable/disable buttons depending on the number of selected rows.
    if(records.length <= 0) {
      tbarBtnDisabled["delete"] = true;
    } else if(records.length == 1) {
      // Disable 'Delete' button if selected network is host/bridge/none
      Ext.Array.each(records, function(record) {
        if((record.get("name") === "bridge" || record.get("name") === "host" || record.get("name") === "none")) {
          tbarBtnDisabled["delete"] = true;
          return false;
        }
      });
    } else {
      // Disable 'Delete' button if selected network is host/bridge/none
      Ext.Array.each(records, function(record) {
        if((record.get("name") === "bridge" || record.get("name") === "host" || record.get("name") === "none")) {
          tbarBtnDisabled["delete"] = true;
          return false;
        }
      });
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

  onCreateButton: function() {
    var me = this;
    var networksStore = me.up('tabpanel').down('dockerNetworksGrid').getStore();
    Ext.create("OMV.module.admin.service.docker.CreateNetwork", {
      title: _("Create network"),
      networksStore: networksStore,
      driver: "macvlan"
    }).show();
  },

  doDeletion: function(record) {
      var me = this;
      OMV.Rpc.request({
          scope: me,
          callback: me.onDeletion,
          rpcData: {
              service: "Docker",
              method: "deleteNetwork",
              params: {
                  name: record.get('name')
              }
          }
      });
  }


});

OMV.WorkspaceManager.registerPanel({
  id: "networks",
  path: "/service/docker",
  text: _("Networks"),
  position: 17,
  className: "OMV.module.admin.service.docker.NetworksGrid"
});
