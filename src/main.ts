import * as core from '@actions/core';
import * as crypto from "crypto";

import { AzureAppService } from 'azure-actions-appservice-rest/lib/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/lib/Utilities/AzureAppServiceUtility';
import { AzureResourceFilterUtility } from 'azure-actions-appservice-rest/lib/Utilities/AzureResourceFilterUtility';
import { IAuthorizationHandler } from "azure-actions-webclient/lib/AuthHandler/IAuthorizationHandler";
import { getHandler } from 'azure-actions-webclient/lib/AuthorizationHandlerFactory';

var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

async function main() {

    try {
		// Set user agent variable
        let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        let actionName = 'AzureAppServiceSettings';
        let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
		
        let webAppName: string = core.getInput('app-name', {required: true});
        let slotName: string = core.getInput('slot-name', {required: false});
        let AppSettings: string = core.getInput('app-settings-json', {required: false});
        let ConnectionStrings: string = core.getInput('connection-strings-json', {required: false});
        let ConfigurationSettings: string = core.getInput('general-settings-json', {required: false});
        let applicationURL: string;

        if(!AppSettings && !ConnectionStrings && !ConfigurationSettings) {
            throw Error('App Service Settings is not enabled. Please provide one of the following : App Settings or General Settings or Connection Strings.');
        }

        // Validating parsed inputs
        if(AppSettings) {
            try {
                var customApplicationSettings = JSON.parse(AppSettings);
                maskValues(customApplicationSettings);
            }
            catch (error) {
                throw new Error('App Settings object is not a valid JSON');
            }
        }

        if(ConnectionStrings) {
            try {
                var customConnectionStrings = JSON.parse(ConnectionStrings);
                maskValues(customConnectionStrings);
            }
            catch (error) {
                throw new Error('Connection Strings object is not a valid JSON');
            }
        }
        
        if(ConfigurationSettings) {
            try {
                var customConfigurationSettings = JSON.parse(ConfigurationSettings);
            }
            catch (error) {
                throw new Error('General Configuration Settings object is not a valid Key Value pairs');
            }
        }
        
        let endpoint: IAuthorizationHandler = await getHandler();
        console.log("Got service connection details for Azure App Service: " + webAppName);

		let appDetails = await AzureResourceFilterUtility.getAppDetails(endpoint, webAppName);
        let resourceGroupName = appDetails["resourceGroupName"];
		console.log("Resource Group : "+ resourceGroupName);

        let appService: AzureAppService = new AzureAppService(endpoint, resourceGroupName, webAppName, slotName);
        let appServiceUtility: AzureAppServiceUtility = new AzureAppServiceUtility(appService);

        if(AppSettings) {
            await appServiceUtility.updateAndMonitorAppSettings(customApplicationSettings, null);
        }

        if(ConnectionStrings) {
            await appServiceUtility.updateConnectionStrings(customConnectionStrings);
        }
        
        if(ConfigurationSettings) {
            await appServiceUtility.updateConfigurationSettings(customConfigurationSettings);
        }

        applicationURL = await appServiceUtility.getApplicationURL();
        core.setOutput('webapp-url', applicationURL);
    }
    catch(error) {
        console.log(JSON.stringify(error));
        core.setFailed(error);
    }
    finally {
        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
    }
}

function maskValues(jsonContent) {
    for(let i = 0; i< Object.keys(jsonContent).length; i++) {
        Object.keys(jsonContent[i]).forEach(key => {
            core.setSecret(jsonContent[i][key]);
        });
    }
}

main();