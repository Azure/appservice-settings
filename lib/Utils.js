"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
class Utils {
    static validateSettings(customSettings, maskInputs) {
        try {
            var customParsedSettings = JSON.parse(customSettings);
            if (!!maskInputs && maskInputs !== "false") {
                Utils.maskValues(customParsedSettings);
            }
            return customParsedSettings;
        }
        catch (error) {
            throw new Error('Given Settings object is not a valid JSON');
        }
    }
    static maskValues(jsonContent) {
        for (let i = 0; i < Object.keys(jsonContent).length; i++) {
            core.setSecret(jsonContent[i].value);
        }
    }
}
exports.Utils = Utils;
