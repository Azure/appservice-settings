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
            console.log("in try");
            var customParsedSettings = JSON.parse(customSettings);
            console.log("1");
            if (maskInputs !== "false") {
                console.log("2 - in if");
                Utils.maskValues(customParsedSettings);
                console.log("3 - end of if");
            }
            console.log("7 - after if before return");
            return customParsedSettings;
        }
        catch (error) {
            console.error(`error is: ${error}`);
            throw new Error('Given Settings object is not a valid JSON');
        }
    }
    static maskValues(jsonContent) {
        console.log("4 - in maskValues");
        for (let i = 0; i < Object.keys(jsonContent).length; i++) {
            console.log("5 - in for");
            core.setSecret(jsonContent[i].value);
            console.log("6 - in for end");
        }
        console.log("7 - maskValues end);
    }
}
exports.Utils = Utils;
