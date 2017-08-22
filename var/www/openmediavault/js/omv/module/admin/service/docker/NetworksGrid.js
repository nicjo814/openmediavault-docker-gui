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
  },{
    xtype: "textcolumn",
    text: _("SUBNET"),
    dataIndex: 'subnet',
    sortable: true,
    stateId: 'subnet',
  },{
    xtype: "textcolumn",
    text: _("CONTAINERS"),
    dataIndex: 'containers',
    sortable: true,
    stateId: 'containers',
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
            { name: "scope", type: "string" },
            { name: "subnet", type: "string" },
            { name: "containers", type: "string" }
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
    },{
      id: me.getId() + "-connect",
      xtype: "button",
      text: _("Connect"),
      icon: "images/plug.png",
      iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
      disabled: true,
      handler: Ext.Function.bind(me.onConnectButton, me, [ me ]),
      scope: me
    },{
      id: me.getId() + "-disconnect",
      xtype: "button",
      text: _("Disconnect"),
      icon: "images/disconnect.png",
      iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
      disabled: true,
      handler: Ext.Function.bind(me.onDisconnectButton, me, [ me ]),
      scope: me
    }]
  },

  onSelectionChange: function(model, records) {
    var me = this;
    if(me.hideTopToolbar)
    return;
    var tbarBtnName = [ "create", "delete", "refresh", "connect", "disconnect" ];
    var tbarBtnDisabled = {
      "create": false,
      "delete": false,
      "refresh": false,
      "connect": false,
      "disconnect": false
    };
    // Enable/disable buttons depending on the number of selected rows.
    if(records.length <= 0) {
      tbarBtnDisabled["delete"] = true;
      tbarBtnDisabled["connect"] = true;
      tbarBtnDisabled["disconnect"] = true;
    } else if(records.length == 1) {
      // Disable 'Delete' button if selected network is host/bridge/none
      Ext.Array.each(records, function(record) {
        if((record.get("name") === "bridge" || record.get("name") === "host" || record.get("name") === "none")) {
          tbarBtnDisabled["delete"] = true;
          return false;
        }
      });
      Ext.Array.each(records, function(record) {
        if((record.get("name") === "host")) {
          tbarBtnDisabled["connect"] = true;
          tbarBtnDisabled["disconnect"] = true;
          return false;
        }
      });
    } else if(records.length > 1) {
      tbarBtnDisabled["connect"] = true;
      tbarBtnDisabled["disconnect"] = true;
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

  onConnectButton: function() {
      var me = this;
      var sm = me.getSelectionModel();
      var records = sm.getSelection();
      var record = records[0];
      var name = record.get('name');
      Ext.create("OMV.module.admin.service.docker.ConnectNetwork", {
        title: _("Connect Network"),
        name: name
      }).show();        
  },

    onDisconnectButton: function() {
      var me = this;
      var sm = me.getSelectionModel();
      var records = sm.getSelection();
      var record = records[0];
      var name = record.get('name');
      Ext.create("OMV.module.admin.service.docker.DisconnectNetwork", {
        title: _("Disconnect Network"),
        name: name
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
