const cds = require('@sap/cds');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

// Função para buscar os valores da entidade cust_integridadeRCM
async function fetchCustIntegridadeRCM() {
    try {
        const response = await executeHttpRequest({
            destinationName: 'SFSF_EXTENSIBILITY_DEV'
        }, {
            method: 'GET',
            url: '/odata/v2/cust_integridadeRCM'
        });

        const cargos = response.data.d.results.map(item => item.cust_cargo.toLowerCase().replace(/[\W_]+/g, ''));
        return cargos;
    } catch (error) {
        console.error('Error fetching cust_integridadeRCM:', error);
        throw new Error('Could not fetch cust_integridadeRCM data');
    }
}

// Função para validar e filtrar as entidades JobApplication
async function validateJobApplications(jobs, validCargos) {
    const removedJobs = [];

    const filteredJobs = jobs.filter(job => {
        const fields = [job.custom_tituloPublico1, job.custom_tituloPublico2, job.custom_tituloPublico3]
            .filter(field => field) // Filtra os campos que estão preenchidos
            .map(field => field.toLowerCase().replace(/[\W_]+/g, '')); // Remove caracteres especiais e coloca em minúsculas

        // Se não há cargos preenchidos, mantemos o registro
        if (fields.length === 0) {
            return true;
        }

        // Verifica se todos os cargos preenchidos estão na lista de cargos válidos
        const allFieldsValid = fields.every(field => validCargos.includes(field));

        if (allFieldsValid) {
            removedJobs.push({
                applicationId: job.applicationId,
                cargos: fields
            });

            // Remove o registro se todos os campos preenchidos forem válidos
            return false;
        }

        // Mantém os registros onde pelo menos um campo preenchido não é válido
        return true;
    });

    // Log dos registros removidos
    if (removedJobs.length > 0) {
        console.log('Registros removidos:', removedJobs);
    }

    return filteredJobs;
}

module.exports = async (srv) => {
    const JobApplicationExt = await cds.connect.to('JobApplicationExt');

    srv.on('READ', 'JobApplication', async (req) => {
        // Obtenha os cargos válidos da entidade cust_integridadeRCM
        const validCargos = await fetchCustIntegridadeRCM();

        // Obtenha os dados da entidade JobApplication
        const jobs = await JobApplicationExt.run(req.query);

        // Verifique se jobs é um array
        if (!Array.isArray(jobs)) {
            // Se jobs não for um array, presumimos que é um único registro
            const singleJob = jobs;

            const fields = [singleJob.custom_tituloPublico1, singleJob.custom_tituloPublico2, singleJob.custom_tituloPublico3]
                .filter(field => field) // Filtra os campos que estão preenchidos
                .map(field => field.toLowerCase().replace(/[\W_]+/g, '')); // Remove caracteres especiais e coloca em minúsculas

            // Se não há cargos preenchidos, mantemos o registro
            if (fields.length === 0) {
                return singleJob;
            }

            // Verifica se todos os cargos preenchidos estão na lista de cargos válidos
            const allFieldsValid = fields.every(field => validCargos.includes(field));

            if (allFieldsValid) {
                console.log('Registro removido:', {
                    applicationId: singleJob.applicationId,
                    cargos: fields
                });

                // Remove o registro se todos os campos preenchidos forem válidos
                return null;
            }

            // Mantém o registro onde pelo menos um campo preenchido não é válido
            return singleJob;
        }

        // Aplique a validação e filtragem para múltiplos registros
        const filteredJobs = await validateJobApplications(jobs, validCargos);

        return filteredJobs; // Retorne os dados filtrados
    });

    srv.on('READ', 'JobApplicationStatus', async (req) => await JobApplicationExt.run(req.query));
    srv.on('READ', 'JobRequisition', async (req) => await JobApplicationExt.run(req.query));
    srv.on('READ', 'PicklistOption', async (req) => await JobApplicationExt.run(req.query));
    srv.on('READ', 'IntegrityOptions', async (req) => await JobApplicationExt.run(req.query));

    srv.on('UpdateJobApplication', async (req) => {
        const { applicationId, customIntegridadeComments, customIntegridadeData, customIntegridadeAvaliador, customIntegridade } = req.data;

        if (!customIntegridadeComments) {
            return req.error(400, 'Field "customIntegridadeComments" is required.');
        }

        if (!customIntegridadeData) {
            return req.error(400, 'Field "customIntegridadeData" is required.');
        }

        if (!customIntegridadeAvaliador) {
            return req.error(400, 'Field "customIntegridadeAvaliador" is required.');
        }

        if (!customIntegridade) {
            return req.error(400, 'Field "customIntegridade" is required.');
        }

        const dateToTimesTamp = new Date(customIntegridadeData).getTime();

        const upsertData = {
            "__metadata": {
                "uri": "JobApplication",
                "type": "SFOData.JobApplication"
            },
            applicationId,
            customIntegridadeComments,
            customIntegridadeAvaliador,
            customIntegridadeData: `/Date(${dateToTimesTamp}+0000)/`,
            "customIntegridade": {
                "__metadata": {
                    "uri": "PicklistOption",
                    "type": "SFOData.PicklistOption"
                },
                "id": customIntegridade
            }
        };

        try {
            const response = await executeHttpRequest({
                destinationName: 'SFSF_EXTENSIBILITY_DEV'
            }, {
                method: 'POST',
                url: '/odata/v2/upsert',
                data: upsertData
            });

            const draftExists = await cds.run(SELECT.one.from('my.jobapplication.Drafts').where({ jobApplicationId: applicationId }));

            if (draftExists) {
                await cds.run(DELETE.from('my.jobapplication.Drafts').where({ jobApplicationId: applicationId }));
                console.log(`Draft for applicationId ${applicationId} has been deleted.`);
            }

            return response.data;
        } catch (error) {
            console.error(error);
            req.error({
                code: error.code || 'INTERNAL_SERVER_ERROR',
                message: error.message,
                target: req.target
            });
        }
    });
};
