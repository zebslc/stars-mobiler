# Azure Static Web Apps - Quick Setup Script
# This script helps you deploy Stars Mobiler to Azure Static Web Apps

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stars Mobiler - Azure Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Azure CLI
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✓ Azure CLI installed: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI not found. Please install from: https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Host "✓ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git not found. Please install Git." -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 20+." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Azure Login" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$login = Read-Host "Login to Azure? (y/n)"
if ($login -eq 'y') {
    az login
}

Write-Host ""
Write-Host "Available subscriptions:" -ForegroundColor Yellow
az account list --output table

Write-Host ""
$subscriptionId = Read-Host "Enter subscription ID to use"
az account set --subscription $subscriptionId

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$resourceGroup = Read-Host "Enter resource group name (default: rg-stars-mobiler)" 
if ([string]::IsNullOrWhiteSpace($resourceGroup)) {
    $resourceGroup = "rg-stars-mobiler"
}

$appName = Read-Host "Enter Static Web App name (default: stars-mobiler)"
if ([string]::IsNullOrWhiteSpace($appName)) {
    $appName = "stars-mobiler"
}

$location = Read-Host "Enter location (default: eastus)"
if ([string]::IsNullOrWhiteSpace($location)) {
    $location = "eastus"
}

$sku = Read-Host "Enter SKU (Free/Standard, default: Free)"
if ([string]::IsNullOrWhiteSpace($sku)) {
    $sku = "Free"
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $resourceGroup" -ForegroundColor Gray
Write-Host "  App Name: $appName" -ForegroundColor Gray
Write-Host "  Location: $location" -ForegroundColor Gray
Write-Host "  SKU: $sku" -ForegroundColor Gray

Write-Host ""
$confirm = Read-Host "Proceed with deployment? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Create Resource Group" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Creating resource group: $resourceGroup..." -ForegroundColor Yellow
az group create --name $resourceGroup --location $location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Deploy Bicep Template" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Deploying infrastructure..." -ForegroundColor Yellow

# Update bicepparam file
$bicepParamContent = @"
using './main.bicep'

param staticWebAppName = '$appName'
param sku = '$sku'
param tags = {
  Environment: 'Production'
  Application: 'Stars Mobiler'
  ManagedBy: 'Bicep'
}
"@

Set-Content -Path "infra/main.bicepparam" -Value $bicepParamContent

az deployment group create `
    --resource-group $resourceGroup `
    --template-file infra/main.bicep `
    --parameters infra/main.bicepparam

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 5: Get Deployment Token" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Retrieving deployment token..." -ForegroundColor Yellow

$deploymentToken = az staticwebapp secrets list `
    --name $appName `
    --resource-group $resourceGroup `
    --query "properties.apiKey" `
    --output tsv

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Add GitHub Secret:" -ForegroundColor Cyan
Write-Host "   - Go to: GitHub Repository → Settings → Secrets and variables → Actions" -ForegroundColor Gray
Write-Host "   - Click 'New repository secret'" -ForegroundColor Gray
Write-Host "   - Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Gray
Write-Host "   - Value: (see below)" -ForegroundColor Gray
Write-Host ""
Write-Host "Deployment Token:" -ForegroundColor Yellow
Write-Host $deploymentToken -ForegroundColor White
Write-Host ""
Write-Host "2. Push to GitHub:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Add Azure deployment configuration'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Your app will be available at:" -ForegroundColor Cyan

$hostname = az staticwebapp show `
    --name $appName `
    --resource-group $resourceGroup `
    --query "defaultHostname" `
    --output tsv

Write-Host "   https://$hostname" -ForegroundColor Green
Write-Host ""
Write-Host "For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Yellow
Write-Host ""
