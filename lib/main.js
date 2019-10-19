"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const crypto = __importStar(require("crypto"));
const azure_app_service_1 = require("azure-actions-appservice-rest/lib/Arm/azure-app-service");
const AzureAppServiceUtility_1 = require("azure-actions-appservice-rest/lib/Utilities/AzureAppServiceUtility");
const AzureResourceFilterUtility_1 = require("azure-actions-appservice-rest/lib/Utilities/AzureResourceFilterUtility");
const AuthorizationHandlerFactory_1 = require("azure-actions-webclient/lib/AuthorizationHandlerFactory");
var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Set user agent variable
            let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
            let actionName = 'AzureAppServiceSettings';
            let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
            let webAppName = core.getInput('app-name', { required: true });
            let slotName = core.getInput('slot-name', { required: false });
            let AppSettings = core.getInput('app-settings-json', { required: false });
            let ConnectionStrings = core.getInput('connection-strings-json', { required: false });
            let ConfigurationSettings = core.getInput('general-settings-json', { required: false });
            let applicationURL;
            if (!AppSettings && !ConnectionStrings && !ConfigurationSettings) {
                throw Error('App Service Settings is not enabled. Please provide one of the following : App Settings or General Settings or Connection Strings.');
            }
            // Validating parsed inputs
            if (AppSettings) {
                try {
                    var customApplicationSettings = JSON.parse(AppSettings);
                    maskValues(customApplicationSettings);
                }
                catch (error) {
                    throw new Error('App Settings object is not a valid JSON');
                }
            }
            if (ConnectionStrings) {
                try {
                    var customConnectionStrings = JSON.parse(ConnectionStrings);
                    maskValues(customConnectionStrings);
                }
                catch (error) {
                    throw new Error('Connection Strings object is not a valid JSON');
                }
            }
            if (ConfigurationSettings) {
                try {
                    var customConfigurationSettings = JSON.parse(ConfigurationSettings);
                }
                catch (error) {
                    throw new Error('General Configuration Settings object is not a valid Key Value pairs');
                }
            }
            let endpoint = yield AuthorizationHandlerFactory_1.getHandler();
            console.log("Got service connection details for Azure App Service: " + webAppName);
            let appDetails = yield AzureResourceFilterUtility_1.AzureResourceFilterUtility.getAppDetails(endpoint, webAppName);
            let resourceGroupName = appDetails["resourceGroupName"];
            console.log("Resource Group : " + resourceGroupName);
            let appService = new azure_app_service_1.AzureAppService(endpoint, resourceGroupName, webAppName, slotName);
            let appServiceUtility = new AzureAppServiceUtility_1.AzureAppServiceUtility(appService);
            if (AppSettings) {
                yield appServiceUtility.updateAndMonitorAppSettings(customApplicationSettings, null);
            }
            if (ConnectionStrings) {
                yield appServiceUtility.updateConnectionStrings(customConnectionStrings);
            }
            if (ConfigurationSettings) {
                yield appServiceUtility.updateConfigurationSettings(customConfigurationSettings);
            }
            applicationURL = yield appServiceUtility.getApplicationURL();
            core.setOutput('webapp-url', applicationURL);
        }
        catch (error) {
            console.log(JSON.stringify(error));
            core.setFailed(error);
        }
        finally {
            // Reset AZURE_HTTP_USER_AGENT
            core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
        }
    });
}
function maskValues(jsonContent) {
    for (let key in jsonContent) {
        if (jsonContent.hasOwnProperty(key)) {
            let value = jsonContent[key];
            core.setSecret(value);
            maskValues(value);
        }
    }
}
main();
