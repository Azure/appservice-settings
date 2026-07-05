import * as core from '@actions/core';

export class Utils {
    private static parseJsonDocuments(customSettings: string, settingType: string): any[] {
        try {
            return [JSON.parse(customSettings)];
        }
        catch (error) {
            const chunks = customSettings
                .split(/\r?\n\s*---\s*\r?\n/g)
                .map(chunk => chunk.trim())
                .filter(chunk => chunk.length > 0);

            if (chunks.length <= 1) {
                throw new Error('Given Settings object is not a valid JSON');
            }

            return chunks.map((chunk, index) => {
                try {
                    return JSON.parse(chunk);
                }
                catch (parseError) {
                    throw new Error(`Invalid JSON in ${settingType} document at index ${index + 1}`);
                }
            });
        }
    }

    private static dedupeByName(entries: any[]): any[] {
        const seenNames = new Set<string>();
        const dedupedEntries: any[] = [];

        for (let index = entries.length - 1; index >= 0; index--) {
            const entry = entries[index];
            const entryName = entry && entry.name;

            if (!entryName || seenNames.has(entryName)) {
                continue;
            }

            seenNames.add(entryName);
            dedupedEntries.push(entry);
        }

        return dedupedEntries.reverse();
    }

    static getMergedAppSettings(customSettings: string, maskInputs?: string): any[] {
        const documents = Utils.parseJsonDocuments(customSettings, 'app-settings-json');
        const mergedSettings: any[] = [];

        for (let index = 0; index < documents.length; index++) {
            if (!Array.isArray(documents[index])) {
                throw new Error(`App settings document at index ${index + 1} must be a JSON array`);
            }

            mergedSettings.push(...documents[index]);
        }

        const finalSettings = Utils.dedupeByName(mergedSettings);
        if (maskInputs !== undefined && maskInputs !== "false") {
            Utils.maskValues(finalSettings);
        }

        return finalSettings;
    }

    static getMergedConnectionStrings(customSettings: string, maskInputs?: string): any[] {
        const documents = Utils.parseJsonDocuments(customSettings, 'connection-strings-json');
        const mergedSettings: any[] = [];

        for (let index = 0; index < documents.length; index++) {
            if (!Array.isArray(documents[index])) {
                throw new Error(`Connection strings document at index ${index + 1} must be a JSON array`);
            }

            mergedSettings.push(...documents[index]);
        }

        const finalSettings = Utils.dedupeByName(mergedSettings);
        if (maskInputs !== undefined && maskInputs !== "false") {
            Utils.maskValues(finalSettings);
        }

        return finalSettings;
    }

    static getMergedConfigurationSettings(customSettings: string): any {
        const documents = Utils.parseJsonDocuments(customSettings, 'general-settings-json');
        let mergedSettings = {};

        for (let index = 0; index < documents.length; index++) {
            if (Array.isArray(documents[index]) || documents[index] === null || typeof documents[index] !== 'object') {
                throw new Error(`General settings document at index ${index + 1} must be a JSON object`);
            }

            mergedSettings = {
                ...mergedSettings,
                ...documents[index]
            };
        }

        return mergedSettings;
    }

    static validateSettings(customSettings: string, maskInputs?: string) {
        try {
            var customParsedSettings = JSON.parse(customSettings);
            if (maskInputs !== undefined && maskInputs !== "false") {
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