sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "com/vale/integrity/assessment/app/connection/connector"
], 
function (JSONModel, Device, connector) {
    "use strict";

    return {
        /**
         * Provides runtime info for the device the UI5 app is running on as JSONModel
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        getJobApp: function(oURLParams) {
            return connector.get({ sPath: "/JobApplication", oURLParams });
        },
        getJobAppDetail: function (jobAppID, oURLParams) {
            return connector.get({ sPath: `/JobApplication(${jobAppID})`, oURLParams });
        },
        getDrafts: function() {
            return connector.get({ sPath: "/Drafts" });
        },
        getOneDraft: function(oURLParams) {
            return connector.get({ sPath: "/Drafts", oURLParams });
        },
        postDraft: function (oData) {
            return connector.post({ sPath: "/Drafts", oData });
        },
        putDraft: function (oEventData, draftID, oURLParams) {
            return connector.put({ sPath: "/Drafts", oChangedData: oEventData, sID: draftID, oURLParams });
        },
        putJobApplication: function (oEventData, jobID, oURLParams) {
            return connector.put({ sPath: "/JobApplication", oChangedData: oEventData, oURLParams: {$filter: `applicationId eq ${jobID}`}, reWriteSettings: true});
        },
        postJobApplication: function (oData) {
            return connector.post({ sPath: "/UpdateJobApplication", oData, bSkipRefresh: true, bReturnSameRoute: false });
        },
        getIntegrityPicklist: function (oURLParams) {
            return connector.get({ sPath: "/IntegrityOptions", oURLParams });
        }
    };

});