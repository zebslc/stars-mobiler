# Azure Deployment Files

This directory contains the infrastructure-as-code (IaC) files for deploying Stars Mobiler to Azure Static Web Apps.

## Files

### `main.bicep`
The main Bicep template that defines the Azure Static Web App resource with:
- Configurable SKU (Free or Standard tier)
- GitHub integration support
- Staging environment policy
- Build configuration for Angular app

### `main.bicepparam`
Parameter file for the Bicep template that overrides default values:
- Static Web App name
- SKU tier selection
- Resource tags

## Usage

### Deploy with Azure CLI

```bash
# Create resource group
az group create --name rg-stars-mobiler --location eastus

# Deploy template
az deployment group create \
  --resource-group rg-stars-mobiler \
  --template-file main.bicep \
  --parameters main.bicepparam
```

### Get Deployment Token

After deployment, retrieve the deployment token for GitHub Actions:

```bash
az staticwebapp secrets list \
  --name stars-mobiler \
  --resource-group rg-stars-mobiler \
  --query "properties.apiKey" \
  --output tsv
```

### Validate Template

```bash
# Validate Bicep syntax
az bicep build --file main.bicep

# Validate deployment
az deployment group validate \
  --resource-group rg-stars-mobiler \
  --template-file main.bicep \
  --parameters main.bicepparam
```

## Customization

### Change App Name

Edit `main.bicepparam`:
```bicep
param staticWebAppName = 'your-custom-name'
```

### Upgrade to Standard Tier

Edit `main.bicepparam`:
```bicep
param sku = 'Standard'
```

**Note**: Standard tier costs approximately $9/month.

### Add Custom Tags

Edit `main.bicepparam`:
```bicep
param tags = {
  Environment: 'Production'
  Application: 'Stars Mobiler'
  ManagedBy: 'Bicep'
  Department: 'Engineering'
  CostCenter: '12345'
}
```

## Outputs

The template provides these outputs:

- `staticWebAppHostname`: The default hostname of your app
- `staticWebAppId`: The Azure resource ID
- `deploymentToken`: The API token for GitHub Actions (sensitive)

## Best Practices

1. **Use Parameter Files**: Keep environment-specific values in `.bicepparam` files
2. **Version Control**: Commit all Bicep files to Git
3. **Resource Naming**: Follow Azure naming conventions
4. **Tags**: Use consistent tagging for resource management
5. **Security**: Never commit deployment tokens to Git

## Learn More

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/staticwebapp)
