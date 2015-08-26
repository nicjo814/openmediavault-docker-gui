/**
* This file is part of OpenMediaVault.
*
* @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
* @author    Volker Theile <volker.theile@openmediavault.org>
* @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
* @copyright Copyright (c) 2009-2015 Volker Theile
* @copyright Copyright (c) 2015 OpenMediaVault Plugin Developers
*
* OpenMediaVault is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* any later version.
*
* OpenMediaVault is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with OpenMediaVault. If not, see <http://www.gnu.org/licenses/>.
i*/

// require("js/omv/Rpc.js")
// require("js/omv/window/Window.js")
// require("js/omv/window/MessageBox.js")
// require("js/omv/form/Panel.js")

/**
* @class OMV.window.Execute
* @derived OMV.window.Window
* Execute the given command asynchronously and display the command output
* in the dialog. The command will be executed right after the dialog has
* been rendered. By pressing the 'Stop' button a RPC will be send to stop
* the command. The 'Close' button will be shown then to close the dialog.
* @param rpcService The name of the RPC service
* @param rpcMethod The name of the method to start the command asynchronously
* @param rpcParams The method arguments of the start RPC
* @param rpcDelay The milliseconds to delay the RPC request. Default is 500.
* @param rpcIgnoreErrors Ignore RPC errors. Set to TRUE to ignore all errors
*   or list special ones in an array. Defaults to FALSE.
* @param hideStartButton Hide the 'Start' button. Defaults to FALSE.
* @param hideStopButton Hide the 'Edit' button. Defaults to FALSE.
* @param hideCloseButton Hide the 'Close' button. Defaults to FALSE.
* @param adaptButtonState Automatically adjust the button states while the
*   command is running. Defaults to TRUE.
* @param scrollBottom Set to TRUE to automatically scroll down the content.
*   Defaults to TRUE.
* @param welcomeText The text that is displayed when the dialog is shown.
*   The text is only shown if \em progress is set to FALSE. Defaults to ''.
*/

Ext.define("OMV.module.admin.service.docker.ExecuteCmd", {
    extend: "OMV.window.Window",
    uses: [
        "OMV.Rpc",
        "OMV.form.Panel",
        "OMV.window.MessageBox"
    ],

    title: _("Execute command"),
    width: 600,
    height: 500,
    layout: "fit",
    modal: true,
    border: false,
    buttonAlign: "center",
    closable: false,

    rpcDelay: 500,
    rpcIgnoreErrors: false,
    rpcIgnoreErrorCodes: [],
    hideStartButton: false,
    hideStopButton: false,
    hideCloseButton: false,
    adaptButtonState: true,
    scrollBottom: true,
    welcomeText: "",

    cmdIsRunning: false,
    getContentAllowed: false,
    containerId: "",

    constructor: function() {
        var me = this;
        me.callParent(arguments);
        /**
         * @event start
         * Fires when the command execution has been started.
         * @param this The window object.
         */
        /**
         * @event finish
         * Fires when the command execution has been finished.
         * @param this The window object.
         * @param response The RPC response object.
         */
        /**
         * @event exception
         * Fires when the command execution has been failed.
         * @param this The window object.
         * @param response The RPC response object.
         */
    },

    initComponent: function() {
        var me = this;

        me.fp = Ext.create("OMV.form.Panel", {
            items: [{
                xtype: "fieldset",
                title: _("Parameters"),
                items: [{
                    xtype: "container",
                    layout: "hbox",
                    pading: "0 0 10 0",
                    items: [{
                        xtype: "textfield",
                        name: "cmd",
                        allowBlank: false,
                        flex: 1,
                        plugins: [{
                            ptype: "fieldinfo",
                            text: _("Command")
                        }],
                        listeners: {
                            change: function(field, newValue, oldValue, eOpts) {
                                me.setButtonDisabled("start", !me.fp.getForm().isValid());
                            }
                        }
                    }]
                }]
            }]
        });
        outtype = Ext.create("Ext.form.FieldSet", {
            title: _("Output"),
            items: [{
                xtype: "textareafield",
                name: "content",
                cls: "x-form-textarea-monospaced",
                value: me.welcomeText,
                readOnly: true,
                grow: true,
                height: 340
            }]
        });

        me.fp.add(outtype);
        Ext.apply(me, {
            items: [ me.fp
            ],
            buttons: [{
                id: me.getId() + "-start",
                text: _("Start"),
                hidden: me.hideStartButton,
                handler: me.start,
                scope: me,
                disabled: !me.fp.getForm().isValid()
            },{
                id: me.getId() + "-stop",
                text: _("Stop"),
                hidden: me.hideStopButton,
                disabled: true,
                handler: me.stop,
                scope: me
            },{
                id: me.getId() + "-close",
                text: _("Close"),
                hidden: me.hideCloseButton,
                handler: me.close,
                scope: me
            }],
        });
        me.contentCtrl = me.fp.getForm().findField("content");

        me.callParent(arguments);
        me.on("show", function() {
            // Set focus to field 'cmd'.
            var field = me.fp.findField("cmd");
            if (!Ext.isEmpty(field))
                field.focus(false, 500);
        }, me);
    },

    /**
     * Start the process.
     */
    start: function() {
        var me = this;
        me.fp.findField("cmd").setReadOnly(true);
        // Update the button states.
        me.setButtonDisabled("start", true);
        // Execute RPC.
        OMV.Rpc.request({
            scope: me,
            callback: function(id, success, response) {
                if (success) {
                    this.getContentAllowed = true;
                    // Command has been executed successfully. Remember the
                    // execution command identifier.
                    this.bgStatusFilename = response;
                    this.cmdContentPos = 0;
                    // Reset controls.
                    this.setValue("");
                    // Display waiting mask.
                    this.contentCtrl.mask(_("Please wait ..."));
                    // Update the button states.
                    this.setButtonDisabled("stop", false);
                    this.setButtonDisabled("close", true);
                    // Fire event.
                    this.fireEvent("start", this);
                    // Begin to request the command output.
                    this.doGetOutput();
                } else {
                    // Enable 'Close' button to be able to close the dialog
                    this.setButtonDisabled("close", false);
                    // Fire exception event to notify listeners.
                    this.fireEvent("exception", this, response);
                }
            },
            relayErrors: true,
            rpcData: {
                service: me.rpcService,
                method: me.rpcMethod,
                params: {
                    cmd: me.fp.findField("cmd").getValue(),
                    containerId: me.containerId
                }
            }
        });
    },

    /**
     * Method that is called when the 'Stop' button is pressed.
     */
    stop: function() {
        var me = this;
        me.getContentAllowed = false;
        // Execute RPC
        OMV.Rpc.request({
            scope: me,
            callback: function(id, success, response) {
                this.contentCtrl.unmask();
                if (success) {
                    // Update the button states.
                    this.setButtonDisabled("start", false);
                    this.setButtonDisabled("stop", true);
                    this.setButtonDisabled("close", false);
                } else {
                    // Enable 'Close' button to be able to close the dialog.
                    this.setButtonDisabled("stop", true);
                    this.setButtonDisabled("close", false);
                    // Fire exception event to notify listeners.
                    this.fireEvent("exception", this, response);
                }
            },
            relayErrors: true,
            rpcData: {
                service: "Exec",
                method: "stop",
                params: {
                    filename: me.bgStatusFilename
                }
            }
        });
    },

    /**
     * Get the command output via RPC.
     * @private
     */
    doGetOutput: function() {
        var me = this;
        // Is command still running? It might happen that the function is
        // called after the 'stop' RPC has been executed because the function
        // is called delayed. In this case simply do not execute the RPC.
        if (me.getContentAllowed === true) {
            // Execute RPC.
            OMV.Rpc.request({
                scope: me,
                callback: function(id, success, response) {
                    if (success) {
                        this.cmdContentPos = response.pos;
                        this.cmdIsRunning = response.running;
                        // Hide the waiting mask if the first content is
                        // transmitted.
                        if (0 < response.pos)
                            this.contentCtrl.unmask();
                        // Update the command content.
                        this.appendValue(response.output);
                        // If command is still running then do another RPC
                        // request.
                        if (this.cmdIsRunning === true) {
                            Ext.Function.defer(this.doGetOutput,
                                               this.rpcDelay, this);
                        } else {
                            this.contentCtrl.unmask();
                            this.fireEvent("finish", this, response);
                        }
                        // Update button states.
                        if (true === this.adaptButtonState) {
                            this.setButtonDisabled("start",
                                                   this.cmdIsRunning);
                                                   this.setButtonDisabled("stop",
                                                                          !this.cmdIsRunning);
                                                                          this.setButtonDisabled("close",
                                                                                                 this.cmdIsRunning);
                        }
                        if (!this.cmdIsRunning) {
                            Ext.getCmp("dockerImageGrid").doReload();
                        }
                    } else {
                        var ignore = false;
                        if (this.rpcIgnoreErrors === true)
                            ignore = true;
                        else if (Ext.isArray(this.rpcIgnoreErrors)) {
                            // Check if there are defined some special error
                            // codes that should be ignored.
                            ignore = Ext.Array.contains(this.rpcIgnoreErrors,
                                                        response.code);
                        }
                        // Ignore RPC errors?
                        if (ignore === true) {
                            // To do not annoy the user with repeating
                            // error message dialogs simply display the
                            // message in the output window.
                            var message = Ext.String.format(
                                "\n" +
                                ">>> *************** Error ***************\n" +
                                "{0}\n" +
                                "<<< *************************************\n",
                                response.message);
                                this.appendValue(message);
                                // Enable 'Close' button to be able to close the
                                // dialog.
                                this.setButtonDisabled("stop", true);
                                this.setButtonDisabled("close", false);
                                // Hide the waiting mask.
                                this.contentCtrl.unmask();
                                // Execute another RPC.
                                Ext.Function.defer(this.doGetOutput,
                                                   this.rpcDelay, this);
                        } else {
                            // Enable 'Close' button to be able to close the
                            // dialog.
                            this.setButtonDisabled("stop", true);
                            this.setButtonDisabled("close", false);
                            // Hide the waiting mask.
                            this.contentCtrl.unmask();
                            // Fire exception to allow listeners to react
                            // on errors.
                            this.fireEvent("exception", this, response);
                        }
                    }
                },
                relayErrors: true,
                rpcData: {
                    service: "Exec",
                    method: "getOutput",
                    params: {
                        filename: me.bgStatusFilename,
                        pos: me.cmdContentPos
                    }
                }
            });
        }
    },

    /**
     * Get the content displayed in the dialog.
     * @return The content displayed in the dialog.
     */
    getValue: function() {
        var me = this;
        var value = "";
        value = me.contentCtrl.getValue();
        return value;
    },

    /**
     * Set the content displayed in the dialog.
     * @param value The value to be displayed in the dialog.
     * @return None
     */
    setValue: function(value, scrollBottom) {
        var me = this;
        me.contentCtrl.setValue(value);
        if(true === me.scrollBottom) {
            var el = me.contentCtrl.inputEl;
            if(el && el.dom)
                el.dom.scrollTop = el.dom.scrollHeight
        }
    },

    /**
     * Appends the given value to the displayed content.
     * @param value The value to be appended to the displayed content.
     * @return None
     */
    appendValue: function(value) {
        var me = this;
        var content = me.contentCtrl.getValue();
        me.contentCtrl.setValue(content + value);
    },

    /**
     * Convenience function for setting the given button disabled/enabled.
     * @param name The name of the button which can be 'start', 'stop'
     *   or 'close'.
     * @param disabled TRUE to disable the button, FALSE to enable.
     * @return The button component, otherwise FALSE.
     */
    setButtonDisabled: function(name, disabled) {
        var me = this;
        var button = me.queryById(me.getId() + "-" + name);
        if(!Ext.isObject(button) || !button.isButton)
            return false;
        return button.setDisabled(disabled);
    },

    /**
     * Convenience function to show or hide the given button.
     * @param name The name of the button which can be 'start', 'stop'
     *   or 'close'.
     * @param visible TRUE to show the button, FALSE to hide.
     * @return The button component, otherwise FALSE.
     */
    setButtonVisible: function(name, visible) {
        var me = this;
        var button = me.queryById(me.getId() + "-" + name);
        if(!Ext.isObject(button) || !button.isButton)
            return false;
        return button.setVisible(visible);
    }
});
