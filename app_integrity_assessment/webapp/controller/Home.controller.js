sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/vale/integrity/assessment/app/model/models",
    "sap/ui/model/json/JSONModel",
    "com/vale/integrity/assessment/app/model/formatter",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"

],
function (Controller, models, JSONModel, formatter, MessageToast, Filter, FilterOperator, MessageBox) {
    "use strict";

    return Controller.extend("com.vale.integrity.assessment.app.controller.Home", {
        formatter: formatter,
        onInit: async function () {
          this.oURLParams = {
            $expand: 'jobRequisition($expand=recruiter),jobAppStatus,statusId',
            //$filter: 'jobAppStatus/appStatusSetId eq 756 or jobAppStatus/appStatusSetId eq 726 or jobAppStatus/appStatusSetId eq 729 or jobAppStatus/appStatusSetId eq 799 or jobAppStatus/appStatusSetId eq 802'
            //$filter: 'jobAppStatus/appStatusSetId eq 659 or jobAppStatus/appStatusSetId eq 658 or jobAppStatus/appStatusSetId eq 662 or jobAppStatus/appStatusSetId eq 663 or jobAppStatus/appStatusSetId eq 661'
          };
          const oRouter = this.getOwnerComponent().getRouter();

          oRouter.getRoute("RouteHome").attachPatternMatched(this._onObjectMatched, this);
  
        },
        _onObjectMatched: async function() {
          this.getView().setBusy(true);
  
          try {
            const oAppJobData = await models.getJobApp(this.oURLParams);
            const oDraftsData = await models.getDrafts();
  
            const oDraftsModel = new JSONModel(oDraftsData);
            this.getView().setModel(oDraftsModel, "drafts");
            const oJobsModel = new JSONModel(oAppJobData);
            this.getView().setModel(oJobsModel, "data");
  
            const oModelDetails = new JSONModel({
              count: oAppJobData.length
            });
            this.getView().setModel(oModelDetails, "dataCount");
            
            this._setGenericProperty();
  
            this.getView().setBusy(false);
  
          } catch (error) {
            console.log(error);
            MessageToast.show("Erro inesperado ao consultar dados.");
            this.getView().setBusy(false);
          }
        },
        onNav: function (oEvent) {
  
          const oRouter = this.getOwnerComponent().getRouter();
  
          const oContext = oEvent.getSource().getBindingContext("data");
  
          const sId = oContext.getProperty("applicationId");
          const sStatus = oContext.getProperty("status");
          
          oRouter.navTo("Details", {
            ID: sId,
            status: sStatus
          });
        },
        onRefresh: function () {
  
          MessageBox.warning("Deseja recarregar a tabela?", {
            title: "Aviso",
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            emphasizedAction: MessageBox.Action.YES,
            onClose: async function (sAction) {
  
              if (sAction === MessageBox.Action.YES) {
                this._onObjectMatched();
                this.getView().byId('searchField').setValue('');
              }
            }.bind(this)
          });
        },
        onSearch: function (oEvent) {
          var aFilters = [];
          var sQuery = oEvent.getSource().getValue();
          if (sQuery && sQuery.length > 0) {
            var filter = new Filter({
              filters: [
                new Filter("jobReqId", FilterOperator.Contains, sQuery),
                new Filter("jobRequisition/position_job_title", FilterOperator.Contains, sQuery),
                new Filter("firstName", FilterOperator.Contains, sQuery),
                new Filter("lastName", FilterOperator.Contains, sQuery),
                new Filter("jobRequisition/recruiter/0/firstName", FilterOperator.Contains, sQuery),
                new Filter("jobRequisition/recruiter/0/lastName", FilterOperator.Contains, sQuery),
                new Filter("status", FilterOperator.Contains, sQuery),
                new Filter("custom_envioIntegridade", FilterOperator.Contains, sQuery)
              ],
            });
            aFilters.push(filter);
          }
  
          var oTable = this.byId("jobApplicationTable");
          var oBinding = oTable.getBinding("rows");
          oBinding.filter(aFilters);
  
          const oCountModel = this.getView().getModel("dataCount");
          oCountModel.setProperty("/count", oBinding.getLength());
        },
        _setGenericProperty: function() {
          const jobAppModel = this.getView().getModel('data').getData();
          const draftsModel = this.getView().getModel('drafts').getData();
  
          jobAppModel.forEach(jobApp => {
            const draft = draftsModel.find(draft => draft.jobApplicationId === jobApp.applicationId);
            
            draft ? jobApp.status = "draft" : jobApp.status = "pending"
  
          });
        },
      });
    });