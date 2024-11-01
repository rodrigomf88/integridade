/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/vale/integrity/assessment/app/model/models",
        "com/vale/integrity/assessment/app/connection/connector"
    ],
    function (UIComponent, Device, models, connector) {
        "use strict";

        return UIComponent.extend("com.vale.integrity.assessment.app.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // init connector
                connector.init(this);
                
                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);