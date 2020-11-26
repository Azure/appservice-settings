import * as core from '@actions/core';

export class Utils {
    static validateSettings(customSettings: string, maskInputs?: string) {
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
    
    static maskValues(jsonContent: any) {
        for(let i = 0; i< Object.keys(jsonContent).length; i++) {
            core.setSecret(jsonContent[i].value);
        }
    }

}