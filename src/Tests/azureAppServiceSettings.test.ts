import * as core from "@actions/core";
import main, {validateSettings} from "../main";

jest.mock('@actions/core');

var jsonObject = {
    'app-name': 'eava11224',
    'app-settings-json': {
        "name": "key2",
        "value": "valueefgh",
        "slotSetting": true
    },
    'connection-strings-json' : {
        "name": "key1",
        "value": "valueabcd",
        "type": "MySql",
        "slotSetting": false
    }
};

describe('Test Azure App Service Settings', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    })
        
    it("Get all variables as input", async () => {
        
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options) => {
            switch(name) {
                case 'app-name': return jsonObject['app-name'];
            }
            return '';
        }); 
        //taskParameters.AppSettings = jsonObject['app-settings-json'].toString();
        try {
            await main();
        }
        catch(e) { 
        }
        expect(getInputSpy).toHaveBeenCalledTimes(5);
    });

    it('Checks valid json', async() => {
        try {
            validateSettings(JSON.stringify(jsonObject['connection-strings-json']));
        }
        catch(e) { 
        }
    })

});