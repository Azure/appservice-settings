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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const core = __importStar(require("@actions/core"));
class Utils {
    static parseJsonDocuments(customSettings, settingType) {
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
    static dedupeByName(entries) {
        const seenNames = new Set();
        const dedupedEntries = [];
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
    static getMergedAppSettings(customSettings, maskInputs) {
        const documents = Utils.parseJsonDocuments(customSettings, 'app-settings-json');
        const mergedSettings = [];
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
    static getMergedConnectionStrings(customSettings, maskInputs) {
        const documents = Utils.parseJsonDocuments(customSettings, 'connection-strings-json');
        const mergedSettings = [];
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
    static getMergedConfigurationSettings(customSettings) {
        const documents = Utils.parseJsonDocuments(customSettings, 'general-settings-json');
        let mergedSettings = {};
        for (let index = 0; index < documents.length; index++) {
            if (Array.isArray(documents[index]) || documents[index] === null || typeof documents[index] !== 'object') {
                throw new Error(`General settings document at index ${index + 1} must be a JSON object`);
            }
            mergedSettings = Object.assign(Object.assign({}, mergedSettings), documents[index]);
        }
        return mergedSettings;
    }
    static validateSettings(customSettings, maskInputs) {
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
    static maskValues(jsonContent) {
        for (let i = 0; i < Object.keys(jsonContent).length; i++) {
            core.setSecret(jsonContent[i].value);
        }
    }
}
exports.Utils = Utils;
