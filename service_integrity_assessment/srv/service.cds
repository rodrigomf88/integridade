using {JobApplicationExt} from './external/JobApplicationExt';
using my.jobapplication as my from '../db/schema';

service MyService @(path: '/proxy'){
 entity JobApplication as projection on JobApplicationExt.JobApplication {
    applicationId,
    candidateId,
    jobReqId,
    firstName,
    lastName,
    jobTitle,
    customIntegridade,
    customIntegridadeComments,
    customIntegridadeData,
    customIntegridadeAvaliador,
    custom_envioIntegridade,

    custom_tituloExGoverno,
    custom_empresaExGoverno,
    custom_localExGoverno,
    custom_exGoverno: redirected to PicklistOption,

    custom_parentePublico1, 
    custom_parentePublico2, 
    custom_parentePublico3,

    custom_tituloPublico1, 
    custom_tituloPublico2, 
    custom_tituloPublico3,

    custom_empresaPublico1,
    custom_empresaPublico2,
    custom_empresaPublico3,

    custom_localPublico1, 
    custom_localPublico2, 
    custom_localPublico3,

    custom_grauPublico1: redirected to PicklistOption, 
    custom_grauPublico2: redirected to PicklistOption, 
    custom_grauPublico3: redirected to PicklistOption,

    jobAppStatus: redirected to JobApplicationStatus,
    jobRequisition: redirected to JobRequisition,
    statusId: redirected to PicklistOption
 };

 entity JobApplicationStatus as projection on JobApplicationExt.JobApplicationStatus;

 entity JobRequisition as projection on JobApplicationExt.JobRequisition {
   position_job_title,
   recruiter: redirected to JobRequisitionOperator
 } 

 entity PicklistOption as projection on JobApplicationExt.PicklistOption;

 entity JobRequisitionOperator as projection on JobApplicationExt.JobRequisitionOperator {firstName, lastName};

 entity Drafts as projection on my.Drafts;

 entity IntegrityOptions as projection on JobApplicationExt.PickListValueV2;

//  action UpdateJobApplication(
//    applicationId: String,
//    customIntegridadeComments: String,
//    customIntegridadeData: String,
//    customIntegridadeAvaliador: String,
//    customIntegridade: String,
//   ) 
  
//   returns String;
}