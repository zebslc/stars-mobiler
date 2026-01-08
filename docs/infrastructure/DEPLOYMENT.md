# Deployment Guide - Azure Static Web Apps

This guide walks you through deploying the Stars Mobiler application to Azure Static Web Apps using Bicep and GitHub Actions.

## Prerequisites

- Azure subscription ([create one free](https://azure.microsoft.com/free/))
- Azure CLI installed ([installation guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- GitHub account
- GitHub repository for this project

## Option 1: Quick Deploy with GitHub Integration (Recommended)

This is the easiest method and requires minimal Azure CLI usage.

### Step 1: Create Static Web App via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search for "Static Web App"
3. Configure:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `stars-mobiler` (or your preferred name)
   - **Plan type**: Select "Free" for cost-effective hosting
   - **Region**: Choose closest to your users
   - **Deployment details**:
     - Source: GitHub
     - Organization: Your GitHub username/org
     - Repository: Your repository name
     - Branch: `main`
   - **Build Details**:
     - Build Presets: Angular
     - App location: `/`
     - Api location: (leave empty)
     - Output location: `dist/stars-mobiler`
4. Click "Review + create" → "Create"

### Step 2: Automatic Configuration

Azure will automatically:
- Create the GitHub Actions workflow in `.github/workflows/`
- Add the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your GitHub repository
- Trigger the first deployment

Your app will be live at: `https://<your-app-name>.azurestaticapps.net`

---

## Option 2: Deploy with Bicep (Infrastructure as Code)

Use this method for reproducible, version-controlled infrastructure.

### Step 1: Login to Azure

```bash
az login
```

### Step 2: Set Active Subscription

```bash
# List subscriptions
az account list --output table

# Set active subscription
az account set --subscription "<subscription-id>"
```

### Step 3: Create Resource Group

```bash
az group create \
  --name rg-stars-mobiler \
  --location eastus
```

### Step 4: Deploy Bicep Template

```bash
az deployment group create \
  --resource-group rg-stars-mobiler \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

### Step 5: Get Deployment Token

```bash
DEPLOYMENT_TOKEN=$(az deployment group show \
  --resource-group rg-stars-mobiler \
  --name main \
  --query properties.outputs.deploymentToken.value \
  --output tsv)

echo $DEPLOYMENT_TOKEN
```

### Step 6: Configure GitHub Secret

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Value: Paste the deployment token from Step 5
5. Click "Add secret"

### Step 7: Trigger Deployment

Push to `main` branch or manually trigger the workflow:

```bash
git add .
git commit -m "Add Azure deployment configuration"
git push origin main
```

Or trigger manually via GitHub Actions tab.

---

## Customization

### Change Static Web App Name

Edit `infra/main.bicepparam`:

```bicep
param staticWebAppName = 'your-custom-name'
```

### Upgrade to Standard Tier

For production workloads with custom domains and advanced features:

```bicep
param sku = 'Standard'
```

**Note**: Standard tier costs ~$9/month. Free tier is sufficient for most use cases.

### Configure Custom Domain

1. Azure Portal → Your Static Web App → Custom domains
2. Add your domain and configure DNS records
3. SSL certificate is automatically provisioned

---

## Environment Configuration

### Angular Environment Files

The build uses `src/environments/environment.prod.ts` for production builds. Configure:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api.azurestaticapps.net', // if you add API
};
```

### Static Web App Configuration

Create `staticwebapp.config.json` in project root for advanced configuration:

```json
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.{css,js,jpg,png,gif,svg,ico,json}"]
  },
  "mimeTypes": {
    ".json": "application/json"
  }
}
```

---

## Monitoring and Management

### View Deployment Logs

- **GitHub Actions**: Repository → Actions tab
- **Azure Portal**: Your Static Web App → Deployment history

### View Application Logs

```bash
az staticwebapp show \
  --name stars-mobiler \
  --resource-group rg-stars-mobiler
```

### Test Staging Environment

Each PR creates a staging environment:
- URL format: `https://<app-name>-<pr-number>.azurestaticapps.net`
- Automatically deleted when PR is closed

---

## Costs

### Free Tier Includes
- 100 GB bandwidth/month
- 250 GB storage
- Custom domains with free SSL
- Staging environments for PRs
- Global CDN distribution

**Perfect for:** Development, personal projects, low-traffic applications

### Standard Tier ($9/month)
- Higher bandwidth (100 GB included, $0.20/GB after)
- SLA guarantees
- Advanced routing
- Custom authentication providers

---

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs for errors
2. Verify build command works locally: `npm run build`
3. Check `output_location` matches Angular output path in `angular.json`

### App Shows 404

1. Ensure `output_location: 'dist/stars-mobiler'` matches your `angular.json` → `outputPath`
2. Add `staticwebapp.config.json` for proper SPA routing

### Deployment Token Invalid

Regenerate token:

```bash
az staticwebapp secrets list \
  --name stars-mobiler \
  --resource-group rg-stars-mobiler
```

---

## Cleanup Resources

To delete all Azure resources:

```bash
az group delete --name rg-stars-mobiler --yes --no-wait
```

---

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [GitHub Actions Documentation](https://docs.github.com/actions)

---

## Support

For issues or questions:
- Open an issue in this repository
- Check Azure Static Web Apps [troubleshooting guide](https://docs.microsoft.com/azure/static-web-apps/troubleshooting)
