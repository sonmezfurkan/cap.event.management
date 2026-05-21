sap.ui.define([], function () {
    "use strict";

    function daysUntil(startDate) {
        if (!startDate) return null;

        var diff = new Date(startDate) - Date.now();
        return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
    }

    return {
        formatDaysUntilNumber: function(startDate) {
            var days = daysUntil(startDate);
            return days !== null ? days : "-";
        },
        
        formatDaysUntilUnit(startDate) {
            var days = daysUntil(startDate);
            return days === 1 ? "day" : "days";
        },
        
        formatDaysUntilState: function(startDate) {
            var days = daysUntil(startDate);

            if (days === null) return "None"
            return days < 7 ? "Warning" : "Success";
        }
    }
})