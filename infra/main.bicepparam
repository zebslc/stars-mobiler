using './main.bicep'

// Override default parameter values as needed
param staticWebAppName = 'stars-mobiler'
param sku = 'Free'
param tags = {
  Environment: 'Production'
  Application: 'Stars Mobiler'
  ManagedBy: 'Bicep'
}
