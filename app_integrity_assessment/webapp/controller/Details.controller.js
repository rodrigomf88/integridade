sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/vale/integrity/assessment/app/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "com/vale/integrity/assessment/app/model/formatter",
    "sap/m/MessageToast"
],
function (Controller, models, JSONModel, MessageBox, formatter, MessageToast) {
    "use strict";

    return Controller.extend("com.vale.integrity.assessment.app.controller.Details", {
        formatter: formatter,
        initialModel: function () {
                
            const oModel = new JSONModel({});
            this.getView().setModel(oModel, "globalModel");

            const oVisibleModel = new JSONModel({ visible: false });
            this.getView().setModel(oVisibleModel, 'bVisible');

            const bSelectedModel = new JSONModel({ selected: false, selected2: false });
            this.getView().setModel(bSelectedModel, 'bSelected');
        },
        onInit: function () {

            this.oURLParams = {
                $expand: 'custom_exGoverno,customIntegridade,custom_grauPublico1,custom_grauPublico2,custom_grauPublico3,jobRequisition($expand=recruiter),jobAppStatus,statusId'
            };

            const oRouter = this.getOwnerComponent().getRouter();

            oRouter.getRoute("Details").attachPatternMatched(this._onObjectMatched, this);

        },
        _onObjectMatched: async function (oEvent) {
            this.initialModel();
            
            const oArgs = oEvent.getParameter("arguments");
            
            const oURLFilterParams = {
                $filter: `jobApplicationId eq ${oArgs.ID}`
            };
            
            const oFilterPicklistParams = {
                $filter: `PickListV2_id eq 'integridade'`
            };

            const oPicklist = models.getIntegrityPicklist(oFilterPicklistParams);
            
            oPicklist
            .then((data) => {
                const oData = new JSONModel(data);
                this.getView().setModel(oData, "picklist");
            })
            .catch((error) => {
                console.log(error);
            });
            
            const existsDraft = models.getOneDraft(oURLFilterParams);
            
            existsDraft
            .then((data) => {
                if (data.length !== 0) {
                    const oGlobalModel = this.getView().getModel('globalModel');
                    const oData = { ...oGlobalModel.getData(), ...data[0], draft: true, externalCode: data[0].optionId === "36276" ? 'Recomendado' : 'Não recomendado', optionId: data[0].optionId };
                    oGlobalModel.setData(oData);
                }
            })
            .catch((error) => {
                console.log(error);
            });
            
            const jobDetails = models.getJobAppDetail(oArgs.ID, this.oURLParams);
            
            jobDetails
            .then((data) => {
                const aCustomExGoverno = data.custom_exGoverno;
                
                if (aCustomExGoverno.length !== 0 && aCustomExGoverno[0].localeLabel === 'Yes') {
                    this.getView().getModel('bSelected').setProperty('/selected', true);
                }
                
                if(data.custom_grauPublico1.length !== 0 || data.custom_grauPublico2.length !== 0 || data.custom_grauPublico3.length !== 0) {
                    this.getView().getModel('bSelected').setProperty('/selected2', true);
                }
                
                const oModel = new JSONModel(data);
                this.getView().setModel(oModel, "data");
                this.getUserLogged();
                const oJobModel = this.getView().getModel('data');
                oJobModel.setProperty('/status', oArgs.status);
            })
            .catch((error) => {
                console.log(error);
                    MessageToast.show("Erro inesperado ao consultar dados.");
            });
        },
        onNavBack: function (oEvent) {

            MessageBox.warning("Ao voltar para página inicial, você perderá todos os dados preenchidos. Deseja continuar?", {
                title: "Aviso",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: async function (sAction) {

                    if (sAction === MessageBox.Action.YES) {

                        const oRouter = this.getOwnerComponent().getRouter();

                        oRouter.navTo("RouteHome");

                    }
                }.bind(this)
            });
        },
        onSendDraft: async function (oEvent) {

            const jobAppByID = this.getView().getModel('data').getData();
            const globalModel = this.getView().getModel('globalModel').getData();
            const picklistData = this.getView().byId('inputIntegrity').getSelectedKey();

            const verifiedOptionId = picklistData !== "" ? picklistData : globalModel.optionId;

            const oDraft = {
                jobApplicationId: jobAppByID.applicationId,
                optionId: verifiedOptionId,
                customIntegridadeComments: globalModel.customIntegridadeComments
            };

            if (globalModel.draft === true) {
                return MessageBox.warning("Já existe um rascunho. Deseja editá-lo?", {
                    title: "Aviso",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: async function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            const oEditDraft = models.putDraft(oDraft, globalModel.ID);
                            oEditDraft
                                .then(() => {
                                    MessageToast.show("Rascunho editado com sucesso!");
                                    const oRouter = this.getOwnerComponent().getRouter();
                                    oRouter.navTo("RouteHome");
                                })
                                .catch((error) => {
                                    console.log(error);
                                    MessageToast.show("Erro ao editar rascunho!");
                                });
                        };
                    }.bind(this)
                });
            };

            const postDraft = models.postDraft(oDraft);

            postDraft
                .then(() => {
                    this.getView().getModel('globalModel').setProperty('/draft', true);
                    MessageToast.show("Rascunho salvo com sucesso!");
                    const oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteHome");
                })
                .catch((error) => {
                    console.log(error);
                    MessageToast.show("Erro ao salvar rascunho!");
                });

        },
        onSendData: function (oEvent) {
            const jobAppByID = this.getView().getModel('data').getData();
            const globalModel = this.getView().getModel('globalModel').getData();
            const oAvaliatorModel = this.getView().getModel('userInfo').getData();
            const pickListKey = this.getView().byId('inputIntegrity').getSelectedKey();
            
            const validatePickListId = pickListKey === '' ? globalModel.optionId : pickListKey
            
            const date = new Date().toISOString();
    
            const oJobInfo = {
                applicationId: jobAppByID.applicationId,
                customIntegridadeComments: globalModel.customIntegridadeComments,
                customIntegridadeData: date,
                customIntegridadeAvaliador: oAvaliatorModel.name,
                customIntegridade: validatePickListId
            };
            
             const postJobApp = models.postJobApplication(oJobInfo);
            
            postJobApp
                .then(() => {
                    MessageToast.show('Dados atualizados com sucesso.')
                    const oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteHome");
                })
                .catch((error) => {
                    console.log(error)
                    MessageToast.show('Erro ao enviar dados.')
                });
            
        },
        getBaseURL: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            const appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath;
        },
        getUserLogged: function () {
            const url = this.getBaseURL() + "/user-api/currentUser";
            const oModel = new JSONModel();
            const mock = {
                firstname: "Local",
                lastname: "Local",
                email: "local@local.com",
                name: "LOCALUSER",
                displayName: "local@local.com"
            };

            oModel.loadData(url);
            oModel.dataLoaded()
                .then(() => {
                    //check if data has been loaded
                    //for local testing, set mock data
                    if (!oModel.getData().email && !oModel.getData().name) {
                        oModel.setData(mock);
                    }
                    this.getView().setModel(oModel, "userInfo");
                    this.gUserLogged = oModel.getData().email;
                    console.log(this.gUserLogged)
                })
                .catch(() => {
                    oModel.setData(mock);
                    this.getView().setModel(oModel, "userInfo");
                    console.log(this.gUserLogged)
                });
        },
    });
});