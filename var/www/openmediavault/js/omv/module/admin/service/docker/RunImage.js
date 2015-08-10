//require("js/omv/window/Window.js")
//require("js/omv/form/Panel.js")

Ext.define("OMV.module.admin.service.docker.RunImage", {
	extend: "OMV.window.Window",
	requires: [
		"OMV.form.Panel",
		"Ext.form.FieldSet",
		"Ext.form.field.Checkbox",
		"Ext.form.field.ComboBox",
		"Ext.form.field.Text"
	],

	title: _("Run image"),
	layout: "fit",
	width: 600,
	closable: true,
	resizable: true,
	buttonAlign: "center",

	constructor: function() {
		var me = this;
		me.callParent(arguments);
	},

	initComponent: function() {
		var me = this;
		me.portCount = 1;
		var generalField = Ext.create("Ext.form.FieldSet", {
			title: _("General"),
			items: [{
				xtype: "textfield",
				fieldLabel: _("Docker image"),
				value: me.image,
				readOnly: true,
				name: "image"
			},{
				xtype: "checkbox",
				name: "restart",
				boxLabel: "Restart on system reboot"

			}]	
		});

		var networkModes = Ext.create('Ext.data.Store', {
			fields: ['mode'],
			data : [
				{"mode": "Host only"},
				{"mode": "Bridged"},
			]
		});	
		var exposedPorts = Ext.create('Ext.data.Store', {
			fields: ['name']
		});	
		exposedPorts.loadData(me.ports);
		var networkField = Ext.create("Ext.form.FieldSet", {
			title: _("Networking"),
			items: [{
				xtype: "combo",
				store: networkModes,
				fieldLabel: "Network mode",
				queryMode: 'local',
				displayField: 'mode',
				valueField: 'mode',
				value: "Select",
				editable: false,
				listeners: {
					scope: me,
					change: function(combo, newValue, oldValue, eOpts) {
						var portField = me.queryById("dockerPortForward");
						if(newValue === "Host only") {
							portField.setHidden(true);
							portField.setDisabled(true);
						} else {
							portField.setHidden(false);
							portField.setDisabled(false);
						}
					}
				}
			},{
				xtype: "fieldset",
				title: _("Port forwarding"),
				id: "dockerPortForward",
				hidden: true,
				disabled: true,
				items: [{
					xtype: "container",
					layout: "hbox",
					shadow: false,
					border: false,
					defaultType: "container",
					defaults: {
						flex: 1
					},
					items: [{html: "Host IP"},
						{html: "Host Port"},
						{html: "Exposed Port"},
						{html: "Custom Port"},
						{html: " "
					}]
				},{
					xtype: "container",
					id: "dockerPortForward-" + me.portCount,
					layout: "hbox",
					shadow: false,
					border: false,
					defaultType: "container",
					defaults: {
						flex: 1
					},
					items: [{
						xtype: "textfield",
						name: "hostip-" + me.portCount,
						value: "0.0.0.0",
					},{
						xtype: "textfield",
						name: "hostport-1"
					},{
						xtype: "combo",
						name: "exposedPort-" + me.portCount,
						store: exposedPorts,
						queryMode: 'local',
						displayField: 'name',
						valueField: 'name',
						value: "Select",
						editable: false,
						listeners: {
							scope: me,
							change: function(combo, newValue, oldValue, eOpts) {
								me.fp.getForm().findField("customPort-" + me.portCount).setValue("");
							}
						}
					},{
						xtype: "textfield",
						name: "customPort-" + me.portCount,
						listeners: {
							scope: me,
							change: function(combo, newValue, oldValue, eOpts) {
								if(newValue === "") {
									me.fp.getForm().findField("exposedPort-" + me.portCount).setDisabled(false);
								} else {
									me.fp.getForm().findField("exposedPort-" + me.portCount).setValue("Select");
									me.fp.getForm().findField("exposedPort-" + me.portCount).setDisabled(true);
								}
							}
						}
						
					},{
						html: " "
						}]
					}]
				}]	
			});
			console.log(me.ports);
			console.log(exposedPorts);	

			me.fp = Ext.create("OMV.form.Panel", {

			});

			me.fp.add(generalField);
			me.fp.add(networkField);
			Ext.apply(me, {
				buttons: [{
					id: me.getId() + "-runImage",
					text: _("Run"),
					handler: me.onRunImage,
					scope: me
				}],
				items: [ me.fp
				]
			});

			me.callParent(arguments);
			me.on("show", function() {
				// Set focus to field 'Username'.
				//var field = me.fp.findField("username");
				//if (!Ext.isEmpty(field))
				//	field.focus(false, 500);
			}, me);
		}

	});

