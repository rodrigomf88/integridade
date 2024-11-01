sap.ui.define([
    "sap/ui/core/format/DateFormat", 
    "sap/ui/core/Locale" 
], 

function(DateFormat, Locale) {
    "use strict";

    return {
        sFullName: function(sFirstName, sLastName) {
            return `${sFirstName} ${sLastName}`
        },
        formatColorScheme: function(sStatus) {
            switch(sStatus){
                case "draft":
                    return 1;
                default:
                    return 10;
            }
        },
        translateText: function(sString) {
            switch(sString) {
                case "pending":
                    return "PENDENTE";
                case "draft":
                    return "RASCUNHO";
            }
        },
        formatStatus: function(sString) {
            switch(sString) {
                case "pending":
                    return "Warning";
                case "draft":
                    return "Information";
            }
        },
        formatDate: function (sDate) {
            if (!sDate) return "";
            var date = new Date(sDate);
            return sap.ui.core.format.DateFormat.getDateTimeInstance({
              pattern: "dd/MM/yyyy"
            }).format(date);
          }
    };
});