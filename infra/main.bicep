@description('Name of the Static Web App')
param staticWebAppName string = 'stars-mobiler'

@description('Location for the Static Web App')
param location string = resourceGroup().location

@description('SKU for the Static Web App')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('Tags to apply to resources')
param tags object = {
  Environment: 'Production'
  Application: 'Stars Mobiler'
  ManagedBy: 'Bicep'
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    repositoryUrl: '' // Will be configured via GitHub integration
    branch: 'main'
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: 'dist/stars-mobiler'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
  }
}

@description('The default hostname of the Static Web App')
output staticWebAppHostname string = staticWebApp.properties.defaultHostname

@description('The resource ID of the Static Web App')
output staticWebAppId string = staticWebApp.id

// Note: Deployment token should be retrieved manually from Azure Portal
// or using Azure CLI: az staticwebapp secrets list --name <app-name>
