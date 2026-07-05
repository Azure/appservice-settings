import * as core from "@actions/core";
import { main } from "../main";
import { Utils } from "../Utils";

import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory";
import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility";
import { AzureAppServiceUtility } from "azure-actions-appservice-rest/Utilities/AzureAppServiceUtility";

jest.mock('@actions/core');
jest.mock('azure-actions-appservice-rest/Arm/azure-app-service');
jest.mock('azure-actions-webclient/AuthorizerFactory');
jest.mock('azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility');
jest.mock('azure-actions-webclient/Authorizer/IAuthorizer');
jest.mock('azure-actions-appservice-rest/Utilities/AzureAppServiceUtility');

const jsonObject = {
    'app-name': 'MOCK_APP_NAME',
    'resource-group-name': 'MOCK_RESOURCE_GROUP',
    'app-kind': 'MOCK_APP_KIND',
    'mask-inputs': 'false',
    'app-settings-json': `[
        {
            "name": "key2",
            "value": "valueefgh",
            "slotSetting": true
        }
    ]`,
    'connection-strings-json': `[
        {
            "name": "key1",
            "value": "valueabcd",
            "type": "MySql",
            "slotSetting": false
        }
    ]`
};

describe('Test Azure App Service Settings', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(AuthorizerFactory, 'getAuthorizer').mockResolvedValue({} as any);
        jest.spyOn(AzureResourceFilterUtility, 'getAppDetails').mockResolvedValue({
            resourceGroupName: jsonObject['resource-group-name'],
            kind: jsonObject['app-kind']
        });
        jest.spyOn(AzureAppServiceUtility.prototype, 'getApplicationURL').mockResolvedValue('http://testurl');
        jest.spyOn(AzureAppServiceUtility.prototype, 'updateAndMonitorAppSettings').mockResolvedValue(undefined as any);
        jest.spyOn(AzureAppServiceUtility.prototype, 'updateConnectionStrings').mockResolvedValue(undefined as any);
        jest.spyOn(AzureAppServiceUtility.prototype, 'updateConfigurationSettings').mockResolvedValue(undefined as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('keeps single JSON behavior in main flow', async () => {
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name) => {
            switch (name) {
                case 'app-name': return jsonObject['app-name'];
                case 'connection-strings-json': return jsonObject['connection-strings-json'];
                case 'mask-inputs': return jsonObject['mask-inputs'];
            }
            return '';
        });

        let updateConnectionStringsSpy = jest.spyOn(AzureAppServiceUtility.prototype, 'updateConnectionStrings');

        await main();

        expect(getInputSpy).toHaveBeenCalledTimes(6);
        expect(updateConnectionStringsSpy).toHaveBeenCalledWith([
            {
                name: 'key1',
                value: 'valueabcd',
                type: 'MySql',
                slotSetting: false
            }
        ]);
    });

    it('merges multiple app settings documents and keeps last value on duplicate name', () => {
        const input = `[
  { "name": "A", "value": "1", "slotSetting": false },
  { "name": "B", "value": "2", "slotSetting": false }
]
---
[
  { "name": "A", "value": "3", "slotSetting": true }
]`;

        const merged = Utils.getMergedAppSettings(input, 'false');

        expect(merged).toEqual([
            { name: 'B', value: '2', slotSetting: false },
            { name: 'A', value: '3', slotSetting: true }
        ]);
    });

    it('merges multiple connection strings documents and keeps last value on duplicate name', () => {
        const input = `[
  { "name": "ConnA", "value": "old", "type": "MySql", "slotSetting": false }
]
---
[
  { "name": "ConnA", "value": "new", "type": "SQLAzure", "slotSetting": true },
  { "name": "ConnB", "value": "next", "type": "PostgreSQL", "slotSetting": false }
]`;

        const merged = Utils.getMergedConnectionStrings(input, 'false');

        expect(merged).toEqual([
            { name: 'ConnA', value: 'new', type: 'SQLAzure', slotSetting: true },
            { name: 'ConnB', value: 'next', type: 'PostgreSQL', slotSetting: false }
        ]);
    });

    it('merges multiple general settings objects and keeps last value on duplicate key', () => {
        const input = `{
  "alwaysOn": true,
  "http20Enabled": false
}
---
{
  "alwaysOn": false,
  "webSocketsEnabled": true
}`;

        const merged = Utils.getMergedConfigurationSettings(input);

        expect(merged).toEqual({
            alwaysOn: false,
            http20Enabled: false,
            webSocketsEnabled: true
        });
    });

    it('masks all merged app setting values when mask-inputs is true', () => {
        const setSecretSpy = jest.spyOn(core, 'setSecret');
        const input = `[
  { "name": "A", "value": "first", "slotSetting": false }
]
---
[
  { "name": "B", "value": "second", "slotSetting": false }
]`;

        Utils.getMergedAppSettings(input, 'true');

        expect(setSecretSpy).toHaveBeenCalledTimes(2);
        expect(setSecretSpy).toHaveBeenNthCalledWith(1, 'first');
        expect(setSecretSpy).toHaveBeenNthCalledWith(2, 'second');
    });

        it('does not mask merged app setting values when mask-inputs is false', () => {
                const setSecretSpy = jest.spyOn(core, 'setSecret');
                const input = `[
    { "name": "A", "value": "first", "slotSetting": false }
]
---
[
    { "name": "B", "value": "second", "slotSetting": false }
]`;

                Utils.getMergedAppSettings(input, 'false');

                expect(setSecretSpy).not.toHaveBeenCalled();
        });

    it('throws a clear error when one of the documents is invalid json', () => {
        const input = `[
  { "name": "A", "value": "ok", "slotSetting": false }
]
---
not-a-json`;

        expect(() => Utils.getMergedAppSettings(input, 'false')).toThrow('Invalid JSON in app-settings-json document at index 2');
    });

});
