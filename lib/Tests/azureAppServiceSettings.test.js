"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const main_1 = require("../main");
const Utils_1 = require("../Utils");
const AuthorizerFactory_1 = require("azure-actions-webclient/AuthorizerFactory");
const AzureResourceFilterUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility");
const AzureAppServiceUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureAppServiceUtility");
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
        jest.spyOn(AuthorizerFactory_1.AuthorizerFactory, 'getAuthorizer').mockResolvedValue({});
        jest.spyOn(AzureResourceFilterUtility_1.AzureResourceFilterUtility, 'getAppDetails').mockResolvedValue({
            resourceGroupName: jsonObject['resource-group-name'],
            kind: jsonObject['app-kind']
        });
        jest.spyOn(AzureAppServiceUtility_1.AzureAppServiceUtility.prototype, 'getApplicationURL').mockResolvedValue('http://testurl');
        jest.spyOn(AzureAppServiceUtility_1.AzureAppServiceUtility.prototype, 'updateAndMonitorAppSettings').mockResolvedValue(undefined);
        jest.spyOn(AzureAppServiceUtility_1.AzureAppServiceUtility.prototype, 'updateConnectionStrings').mockResolvedValue(undefined);
        jest.spyOn(AzureAppServiceUtility_1.AzureAppServiceUtility.prototype, 'updateConfigurationSettings').mockResolvedValue(undefined);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('keeps single JSON behavior in main flow', () => __awaiter(void 0, void 0, void 0, function* () {
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name) => {
            switch (name) {
                case 'app-name': return jsonObject['app-name'];
                case 'connection-strings-json': return jsonObject['connection-strings-json'];
                case 'mask-inputs': return jsonObject['mask-inputs'];
            }
            return '';
        });
        let updateConnectionStringsSpy = jest.spyOn(AzureAppServiceUtility_1.AzureAppServiceUtility.prototype, 'updateConnectionStrings');
        yield main_1.main();
        expect(getInputSpy).toHaveBeenCalledTimes(6);
        expect(updateConnectionStringsSpy).toHaveBeenCalledWith([
            {
                name: 'key1',
                value: 'valueabcd',
                type: 'MySql',
                slotSetting: false
            }
        ]);
    }));
    it('merges multiple app settings documents and keeps last value on duplicate name', () => {
        const input = `[
  { "name": "A", "value": "1", "slotSetting": false },
  { "name": "B", "value": "2", "slotSetting": false }
]
---
[
  { "name": "A", "value": "3", "slotSetting": true }
]`;
        const merged = Utils_1.Utils.getMergedAppSettings(input, 'false');
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
        const merged = Utils_1.Utils.getMergedConnectionStrings(input, 'false');
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
        const merged = Utils_1.Utils.getMergedConfigurationSettings(input);
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
        Utils_1.Utils.getMergedAppSettings(input, 'true');
        expect(setSecretSpy).toHaveBeenCalledTimes(2);
        expect(setSecretSpy).toHaveBeenNthCalledWith(1, 'first');
        expect(setSecretSpy).toHaveBeenNthCalledWith(2, 'second');
    });
    it('throws a clear error when one of the documents is invalid json', () => {
        const input = `[
  { "name": "A", "value": "ok", "slotSetting": false }
]
---
not-a-json`;
        expect(() => Utils_1.Utils.getMergedAppSettings(input, 'false')).toThrow('Invalid JSON in app-settings-json document at index 2');
    });
});
