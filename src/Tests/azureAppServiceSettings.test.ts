import * as core from "@actions/core";
import main, {validateSettings} from "../main";

import { AzureAppService } from 'azure-actions-appservice-rest/lib/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/lib/Utilities/AzureAppServiceUtility';
import { AzureResourceFilterUtility } from 'azure-actions-appservice-rest/lib/Utilities/AzureResourceFilterUtility';
import { IAuthorizationHandler } from 'azure-actions-webclient/lib/AuthHandler/IAuthorizationHandler';
import { getHandler } from 'azure-actions-webclient/lib/AuthorizationHandlerFactory';
import { resolve } from "dns";

jest.mock('@actions/core');
jest.mock('azure-actions-appservice-rest/lib/Arm/azure-app-service');
jest.mock('azure-actions-webclient/lib/AuthorizationHandlerFactory');
jest.mock('azure-actions-appservice-rest/lib/Utilities/AzureResourceFilterUtility');
jest.mock('azure-actions-webclient/lib/AuthHandler/IAuthorizationHandler');
jest.mock('azure-actions-appservice-rest/lib/Utilities/AzureAppServiceUtility');

var jsonObject = {
    'app-name': 'MOCK_APP_NAME',
    'resource-group-name' : 'MOCK_RESOURCE_GROUP',
    'app-kind' : 'MOCK_APP_KIND',
    'app-settings-json': `[
        {
            "name": "key2",
            "value": "valueefgh",
            "slotSetting": true
        }
    ]`,
    'connection-strings-json' : `[
        {
        "name": "key1",
        "value": "valueabcd",
        "type": "MySql",
        "slotSetting": false
        }
    ]`
};

describe('Test Azure App Service Settings', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    })
        
    it("Get all variables as input", async () => {
        
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options) => {
            switch(name) {
                case 'app-name': return jsonObject['app-name'];
                case 'connection-strings-json' : return jsonObject['connection-strings-json'];
            }
            return '';
        });

        let appDetails = jest.spyOn(AzureResourceFilterUtility, 'getAppDetails').mockResolvedValue({
            resourceGroupName: jsonObject['resource-group-name'],
            kind: jsonObject['app-kind']
        });

        try {
            await main();
        }
        catch(e) {
            console.log(e);
        }

        expect(getInputSpy).toHaveBeenCalledTimes(5);
        expect(appDetails).toHaveBeenCalled();
    });

    it('Checks valid json', async() => {
        try {
            validateSettings(JSON.stringify(jsonObject['connection-strings-json']));
            validateSettings(JSON.stringify(jsonObject['app-settings-json']));
        }
        catch(e) { 
        }
    })

});