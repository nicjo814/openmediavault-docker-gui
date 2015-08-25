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

// require("js/omv/module/admin/service/docker/PullImage.js")

Ext.define("OMV.module.admin.service.docker.DockerRepoGrid", {
	extend: "OMV.workspace.grid.Panel",
	alias: "widget.dockerRepoGrid",

	id: "dockerRepoGrid",
	hideDeleteButton: true,
	hideAddButton: true,
	hideEditButton: true,

	rpcService: "Docker",
	rpcGetMethod: "getDockerRepo",
	requires: [
		"OMV.data.Store",
		"OMV.data.Model",
		"OMV.data.proxy.Rpc"
	],

	stateful: true,
	stateId: "a458e082-8422-4564-a679-a47d9d001d0f",

	defaults: {
		flex: 1
	},

	columns: [{
		text: _("Category"),
		dataIndex: 'category',
		sortable: true,
		stateId: 'category',
	},{
		text: _("Logo"),
		dataIndex: 'logo',
		renderer: function(value){
			return '<img src="images/dockerrepo/' + value + '" />';
		},
		sortable: false,
	},{
		text: _("Name"),
		dataIndex: 'name',
		sortable: true,
		stateId: 'name',
	},{
		text: _("Description"),
		dataIndex: 'desc',
		sortable: true,
		stateId: 'desc'
	},{
		text: _("Repository"),
		dataIndex: 'repo',
		sortable: true,
		stateId: 'repo'
	},{
		text: _("Pull"),
		xtype:'actioncolumn',
		items: [{
			icon: 'images/download.png',  // Use a URL in the icon config
			tooltip: _("Pull image"),
			handler: function(grid, rowIndex, colIndex) {
				var rec = grid.getStore().getAt(rowIndex);
				Ext.create("OMV.module.admin.service.docker.PullImage", {
					title: _("Pull image"),
					rpcService: "Docker",
					rpcMethod: "pullImage",
					hideStopButton: true,
					repo: rec.get("repo"),
					listeners: {
						scope: this,
						exception: function(wnd, error) {
							OMV.MessageBox.error(null, error);
						}
					}
				}).show();
			}
		}]
	}],

	initComponent: function() {
		var me = this;
		Ext.apply(me, {
			store: Ext.create("OMV.data.Store", {
				pageSize: 10,
				autoLoad: true,
				model: OMV.data.Model.createImplicit({
					fields: [
						{ name: "logo", type: "string" },
						{ name: "category", type: "string" },
						{ name: "name", type: "string" },
						{ name: "desc", type: "string" },
						{ name: "repo", type: "string" }
					]
				}),
				proxy: {
					type: "rpc",
					rpcData: {
						service: "Docker",
						method: "getDockerRepo",
					}
				}
			})
		});
		me.callParent(arguments);
	}
});

OMV.WorkspaceManager.registerPanel({
	id: "dockerRepo",
	path: "/service/docker",
	text: _("Docker repo"),
	position: 15,
	className: "OMV.module.admin.service.docker.DockerRepoGrid"
});
