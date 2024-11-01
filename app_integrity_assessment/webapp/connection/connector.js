sap.ui.define([
    "sap/ui/model/odata/v4/ODataModel",
  ],
    function (ODataModel) {
      "use strict";
  
      return {
        
        init: function (oComponent) {
          this._oComponent = oComponent
        },
  
        getOwnerComponent: function () {
          return this._oComponent
        },
  
        getODataModel: function () {
          const oDataModel = this.getOwnerComponent().getModel("backend")
          return oDataModel
        },
  
        _oDataBindingList: function(sPath, oContext, oURLParams){
          return this.getODataModel().bindList(sPath, oContext, null, null, oURLParams);
        },
  
        get: function ({sPath, oURLParams, oContext}) {
          const oODataModel = this.getODataModel();
  
          const oDataContext = oODataModel.bindContext(sPath, oContext, oURLParams)
  
          return new Promise((resolve, reject) => {
              const oRequestedObject = oDataContext.requestObject()
  
              return oRequestedObject
                  .then((oData) => {
                      resolve(oData.value || oData)
                  })
                  .catch((err) =>{
                      reject(err)
                  })
          })
        },
        
        post: function ({oData, sPath, oContext, oURLParams, bReturnSameRoute = true, bSkipRefresh = false, bReturnEntity= true}) {
          const oDataBindList = this._oDataBindingList(sPath, oContext);
          const oEntity = oDataBindList.create(oData, bSkipRefresh)
          
          return new Promise(async (resolve, reject) => {
            oDataBindList.attachCreateCompleted(() => { 
              const aBatchMessages = oDataBindList.getModel().mMessages[""]
  
              if(aBatchMessages){
                const aBatchMessagesClone = [...aBatchMessages].reverse()
                const hasBatchError = aBatchMessagesClone?.find(res => res.message !== '' && res.code >= 400); 
    
                const time = new Date().getTime()
    
                if(hasBatchError && time-100 < hasBatchError.date) {
                  reject(hasBatchError)
                }
              }
  
              if(bReturnSameRoute){
                resolve(this.get({sPath, oURLParams}))
              }
              if(bReturnEntity){
                resolve(oEntity)
              }
            resolve()
        })})
        },
  
        put: function({oChangedData, sPath, sID, oURLParams, oContext, bReturnSameRoute = true, reWriteSettings = false}){
            let oSettings = {
              $filter: `ID eq ${sID}`
            } 
            
            if(reWriteSettings){
              oSettings = oURLParams
            }
  
            const oDataBindList = this._oDataBindingList(sPath, oContext, oSettings);
            
            return new Promise(async (resolve, reject) => {
  
            oDataBindList.requestContexts().then(async aData => {
              const oData = aData[0]
 
              await Promise.all(Object.entries(oChangedData).map(([key, value]) => {
                return oData.setProperty(key, value);
              }))
              
              if(bReturnSameRoute){
                resolve(this.get({sPath, oURLParams}));
              }
              resolve()
            })
              .catch(err => {
                reject(err)
            })
  
          })
        },
  
        delete: function({sPath, sID, oURLParams, oContext, bReturnSameRoute = true}){
          const oSettings = {
            $filter: `ID eq ${sID}`
          }
    
          const oDataBindList = this._oDataBindingList(sPath, oContext, oSettings);
  
          return new Promise((resolve, reject) => {
  
            oDataBindList.requestContexts().then(aData => {
              const oData = aData[0]
  
              oData.delete()
             
              if(bReturnSameRoute){
                resolve(this.get({sPath, oURLParams}));
              }
              resolve(oData.oDeletePromise.getResult())
            })
              .catch(err => {
                reject(err)
            })
          })
        },
      };
    });