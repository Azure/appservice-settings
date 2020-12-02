# GitHub Action for configuring Azure App service Settings

With the Azure App Service Actions for GitHub, you can automate your workflow to deploy [Azure Web Apps](https://azure.microsoft.com/en-us/services/app-service/web/) and configure [App settings](https://docs.microsoft.com/en-us/azure/app-service/configure-common).

Get started today with a [free Azure account](https://azure.com/free/open-source)!

This repository contains GitHub Action for [Azure App Service Settings](https://github.com/Azure/appservice-settings) to configure App settings, connection strings and other general settings in bulk using JSON syntax on your Azure WebApp (Windows or Linux) or any of its deployment slots. 

The action works for ASP.NET, ASP.NET Core, PHP, Java, Python, Go and Node.js based web applications.

If you are looking for a Github Actions to deploy code or a customized image into an Azure Webapp, consider using [WebApps-deploy](https://github.com/Azure/webapps-deploy) action.

The definition of this Github Action is in [action.yml](https://github.com/Azure/appservice-settings/blob/master/action.yml).

# End-to-End Sample Workflow

## Dependencies on other Github Actions

* Authenticate using [Azure Login](https://github.com/Azure/login)

## Create Azure Web App and deploy using GitHub Actions
1. Follow the tutorial [Azure Web Apps Quickstart](https://docs.microsoft.com/en-us/azure/app-service/overview#next-steps)
2. Pick a template from https://github.com/Azure/actions-workflow-samples depending on your Azure web app **runtime** and place the template to `.github/workflows/` in your project repository.
3. Change `app-name` to your Web app name.
4. Commit and push your project to GitHub repository, you should see a new GitHub Action initiated in **Actions** tab.

## Configure GitHub Secrets with Azure Credentials, App Settings and Connection Strings
For using any sensitive data/secrets like Azure Service Principal, App Settings or Connection Strings within an Action, add them as [secrets](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables) in the GitHub repository and then use them in the workflow. If you do not have sensitive information in the app-settings -json and connection-strings-json and do not want to set it as secret, set `mask-inputs` as false in the workflow. By default, `mask-inputs` will be true. If `mask-inputs: false` is not provided, app-settings-json and connection-strings-json will be set as secrets and masked in logs. `mask-inputs` is not applicable to general-settings-json.

Follow the steps to configure the secrets:
  * Define a new secret under your repository **Settings** > **Secrets** > **Add a new secret** menu
  * Paste the contents of the below [az cli](https://docs.microsoft.com/en-us/cli/azure/?view=azure-cli-latest) command as the value of secret variable, for example 'AZURE_CREDENTIALS'
```bash  

   az ad sp create-for-rbac --name {app-name} --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
                            --sdk-auth
                            
  # Replace {subscription-id}, {resource-group} and {app-name} with the subscription, resource group and name of the WebApp
  
  # The command should output a JSON object similar to this:

  {
    "clientId": "<GUID>",
    "clientSecret": "<GUID>",
    "subscriptionId": "<GUID>",
    "tenantId": "<GUID>",
    (...)
  }
  
```
* In the [Azure portal](https://portal.azure.com/), navigate to your app's management page. In the app's left menu, click **Configuration** > **Application settings**. To add or edit app settings in bulk, click the **Advanced edit** button.
You could copy the existing App settings and make necessary changes or create a JSON object of the following format and define a new secret variable (APP_SETTINGS):
```yaml
[
  {
    "name": "<key-1>",
    "value": "<value-1>",
    "slotSetting": false
  },
  {
    "name": "<key-2>",
    "value": "<value-2>",
    "slotSetting": false
  },
  ...
]
 ```
* In the [Azure portal](https://portal.azure.com/), navigate to your app's management page. In the app's left menu, click **Configuration** > **Application settings** > **Connection Strings**. To add or edit connection strings in bulk, click the **Advanced edit** button.
You could copy the existing App settings and make necessary changes or create a JSON object of the following format and define a new secret variable (CONNECTION_STRINGS):
```yaml
[
  {
    "name": "name-1",
    "value": "conn-string-1",
    "type": "SQLServer",
    "slotSetting": false
  },
  {
    "name": "name-2",
    "value": "conn-string-2",
    "type": "PostgreSQL",
    "slotSetting": false
  },
  ...
]
 ```
 
### Sample workflow to configure settings on an Azure Web App

```yaml
# .github/workflows/configureAppSettings.yml
on: [push]

jobs:
  build:
    runs-on: windows-latest
    steps:
    - uses: azure/login@v1
      with:
        creds: '${{ secrets.AZURE_CREDENTIALS }}'
    - uses: azure/appservice-settings@v1
      with:
        app-name: 'my-app'
        slot-name: 'staging'  # Optional and needed only if the settings have to be configured on the specific deployment slot
        app-settings-json: '${{ secrets.APP_SETTINGS }}' 
        connection-strings-json: '${{ secrets.CONNECTION_STRINGS }}'
        general-settings-json: '{"alwaysOn": "false", "webSocketsEnabled": "true"}' #'General configuration settings as Key Value pairs'
      id: settings
    - run: echo "The webapp-url is ${{ steps.settings.outputs.webapp-url }}"
    - run: |
        az logout
 ```

### Sample workflow to configure settings on an Azure Web App when inputs need not be masked
```yaml
# .github/workflows/configureAppSettings.yml
on: [push]

jobs:
  build:
    runs-on: windows-latest
    steps:
    - uses: azure/login@v1
      with:
        creds: '${{ secrets.AZURE_CREDENTIALS }}'
    - uses: azure/appservice-settings@v1
      with:
        app-name: 'my-app'
        mask-inputs: false
        slot-name: 'staging'  # Optional and needed only if the settings have to be configured on the specific deployment slot
        app-settings-json: '[{ "name": "SCM_DO_BUILD_DURING_DEPLOYMENT", "value": "1", "slotSetting": false }]'
      id: settings
    - run: echo "The webapp-url is ${{ steps.settings.outputs.webapp-url }}"
    - run: |
        az logout
 ```


# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
