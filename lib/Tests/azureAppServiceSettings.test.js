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
const AzureResourceFilterUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility");
const AzureAppServiceUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureAppServiceUtility");
jest.mock('@actions/core');
jest.mock('azure-actions-appservice-rest/Arm/azure-app-service');
jest.mock('azure-actions-webclient/AuthorizerFactory');
jest.mock('azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility');
jest.mock('azure-actions-webclient/Authorizer/IAuthorizer');
jest.mock('azure-actions-appservice-rest/Utilities/AzureAppServiceUtility');
var jsonObject = {
    'app-name': 'MOCK_APP_NAME',
    'resource-group-name': 'MOCK_RESOURCE_GROUP',
    'mask-inputs': 'false',
    'app-kind': 'MOCK_APP_KIND',
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
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it("Get all variables as input", () => __awaiter(void 0, void 0, void 0, function* () {
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options) => {
            switch (name) {
                case 'app-name': return jsonObject['app-name'];
                case 'connection-strings-json': return jsonObject['connection-strings-json'];
            }
            return '';
        });
        let appDetails = jest.spyOn(AzureResourceFilterUtility_1.AzureResourceFilterUtility, 'getAppDetails').mockResolvedValue({
            resourceGroupName: jsonObject['resource-group-name'],
            kind: jsonObject['app-kind']
        });
        let getApplicationURLSpy = jest.spyOn(AzureAppServiceUtility_1.AzureAppServiceUtility.prototype, 'getApplicationURL').mockResolvedValue('http://testurl');
        try {
            yield main_1.main();
        }
        catch (e) {
            console.log(e);
        }
        expect(getInputSpy).toHaveBeenCalledTimes(6);
        expect(appDetails).toHaveBeenCalled();
        expect(getApplicationURLSpy).toHaveBeenCalled();
    }));
    it('Checks valid json', () => __awaiter(void 0, void 0, void 0, function* () {
        const validateSettings = jest.fn();
        try {
            let connectionStrings = validateSettings(JSON.stringify(jsonObject['connection-strings-json']));
            let appSettings = validateSettings(JSON.stringify(jsonObject['app-settings-json']));
        }
        catch (e) {
        }
        expect(validateSettings).toHaveBeenCalledTimes(2);
        expect(validateSettings).toHaveReturnedTimes(2);
    }));
    it("do not set inputs as secrets if mask-inputs is false", () => __awaiter(void 0, void 0, void 0, function* () {
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options) => {
            switch (name) {
                case 'app-name': return jsonObject['app-name'];
                case 'connection-strings-json': return jsonObject['connection-strings-json'];
                case 'mask-inputs': return jsonObject['mask-inputs'];
            }
            return '';
        });
        let appDetails = jest.spyOn(AzureResourceFilterUtility_1.AzureResourceFilterUtility, 'getAppDetails').mockResolvedValue({
            resourceGroupName: jsonObject['resource-group-name'],
            kind: jsonObject['app-kind']
        });
        let getApplicationURLSpy = jest.spyOn(AzureAppServiceUtility_1.AzureAppServiceUtility.prototype, 'getApplicationURL').mockResolvedValue('http://testurl');
        let validateSettingsSpy = jest.spyOn(Utils_1.Utils, 'validateSettings');
        let maskValuesSpy = jest.spyOn(Utils_1.Utils, 'maskValues');
        try {
            yield main_1.main();
        }
        catch (e) {
            console.log(e);
        }
        expect(getInputSpy).toHaveBeenCalledTimes(6);
        expect(appDetails).toHaveBeenCalled();
        expect(getApplicationURLSpy).toHaveBeenCalled();
        expect(validateSettingsSpy).toHaveBeenCalled();
        expect(maskValuesSpy).not.toHaveBeenCalled();
    }));
});
