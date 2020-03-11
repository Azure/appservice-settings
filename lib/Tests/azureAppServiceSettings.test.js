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
const main_1 = __importStar(require("../main"));
const AzureResourceFilterUtility_1 = require("azure-actions-appservice-rest/lib/Utilities/AzureResourceFilterUtility");
jest.mock('@actions/core');
jest.mock('azure-actions-appservice-rest/lib/Arm/azure-app-service');
jest.mock('azure-actions-webclient/lib/AuthorizationHandlerFactory');
jest.mock('azure-actions-appservice-rest/lib/Utilities/AzureResourceFilterUtility');
jest.mock('azure-actions-webclient/lib/AuthHandler/IAuthorizationHandler');
jest.mock('azure-actions-appservice-rest/lib/Utilities/AzureAppServiceUtility');
var jsonObject = {
    'app-name': 'MOCK_APP_NAME',
    'resource-group-name': 'MOCK_RESOURCE_GROUP',
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
        try {
            yield main_1.default();
        }
        catch (e) {
            console.log(e);
        }
        expect(getInputSpy).toHaveBeenCalledTimes(5);
        expect(appDetails).toHaveBeenCalled();
    }));
    it('Checks valid json', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            main_1.validateSettings(JSON.stringify(jsonObject['connection-strings-json']));
            main_1.validateSettings(JSON.stringify(jsonObject['app-settings-json']));
        }
        catch (e) {
        }
    }));
});
