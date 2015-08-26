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

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/panel/Panel.js")
// require("js/omv/module/admin/service/docker/ImageGrid.js")
// require("js/omv/module/admin/service/docker/ContainerGrid.js")

Ext.define("OMV.module.admin.service.docker.Overview", {
    extend: "OMV.workspace.panel.Panel",
    requires: [
        "OMV.module.admin.service.docker.ImageGrid"
    ],
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    initComponent : function() {
        this.on("afterrender", function () {
            var parent = this.up("tabpanel");

            if (!parent) {
                return;
            }

            var overviewPanel = parent.down("panel[title=" + _("Overview") + "]");
            var settingsPanel = parent.down("panel[title=" + _("Settings") + "]");
            var checked = settingsPanel.findField("enabled").checked;
            var version = settingsPanel.findField("version").getValue();

            if (overviewPanel) {
                if (checked && version !== "0") {
                    overviewPanel.enable();
                    overviewPanel.tab.show();
                    parent.setActiveTab(overviewPanel);
                } else {
                    overviewPanel.disable();
                    overviewPanel.tab.hide();
                    parent.setActiveTab(settingsPanel);
                }
            }
        }, this);

        this.callParent(arguments);
    },
    items: [{
        xtype: 'dockerImageGrid',
        flex: 1,
        collapsible: true,
        title: _('Docker Images')
    },{
        xtype: 'splitter'
    },{
        xtype: 'dockerContainerGrid',
        flex: 1,
        collapsible: true,
        title: _('Docker Containers')
    }]

});

OMV.WorkspaceManager.registerPanel({
    id: "overview",
    path: "/service/docker",
    text: _("Overview"),
    position: 10,
    className: "OMV.module.admin.service.docker.Overview"
});
