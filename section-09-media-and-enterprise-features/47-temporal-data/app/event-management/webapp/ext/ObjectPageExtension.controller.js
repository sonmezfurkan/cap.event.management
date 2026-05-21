sap.ui.define(["sap/ui/core/mvc/ControllerExtension"], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("app.events.eventmanagement.ext.ObjectPageExtension", {
        override: {
            routing: {
                onAfterBinding: function (oBindingContext) {
                    console.log("[ObjectPage] Loaded event: ", oBindingContext.getPath())
                }
            }
        }
    })
})