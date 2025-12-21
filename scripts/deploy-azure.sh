#!/bin/bash

# Azure Static Web Apps - Quick Setup Script
# This script helps you deploy Stars Mobiler to Azure Static Web Apps

set -e

echo "========================================"
echo "Stars Mobiler - Azure Deployment Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Azure CLI
if command -v az &> /dev/null; then
    AZ_VERSION=$(az version --query '"azure-cli"' -o tsv)
    echo -e "${GREEN}✓ Azure CLI installed: ${AZ_VERSION}${NC}"
else
    echo -e "${RED}✗ Azure CLI not found. Please install from: https://docs.microsoft.com/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓ Git installed: ${GIT_VERSION}${NC}"
else
    echo -e "${RED}✗ Git not found. Please install Git.${NC}"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 20+.${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Step 1: Azure Login${NC}"
echo -e "${CYAN}========================================${NC}"

read -p "Login to Azure? (y/n): " LOGIN
if [ "$LOGIN" = "y" ]; then
    az login
fi

echo ""
echo -e "${YELLOW}Available subscriptions:${NC}"
az account list --output table

echo ""
read -p "Enter subscription ID to use: " SUBSCRIPTION_ID
az account set --subscription "$SUBSCRIPTION_ID"

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Step 2: Configuration${NC}"
echo -e "${CYAN}========================================${NC}"

read -p "Enter resource group name (default: rg-stars-mobiler): " RESOURCE_GROUP
RESOURCE_GROUP=${RESOURCE_GROUP:-rg-stars-mobiler}

read -p "Enter Static Web App name (default: stars-mobiler): " APP_NAME
APP_NAME=${APP_NAME:-stars-mobiler}

read -p "Enter location (default: eastus): " LOCATION
LOCATION=${LOCATION:-eastus}

read -p "Enter SKU (Free/Standard, default: Free): " SKU
SKU=${SKU:-Free}

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Name: $APP_NAME"
echo "  Location: $LOCATION"
echo "  SKU: $SKU"

echo ""
read -p "Proceed with deployment? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Step 3: Create Resource Group${NC}"
echo -e "${CYAN}========================================${NC}"

echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP...${NC}"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Step 4: Deploy Bicep Template${NC}"
echo -e "${CYAN}========================================${NC}"

echo -e "${YELLOW}Deploying infrastructure...${NC}"

# Update bicepparam file
cat > infra/main.bicepparam << EOF
using './main.bicep'

param staticWebAppName = '$APP_NAME'
param sku = '$SKU'
param tags = {
  Environment: 'Production'
  Application: 'Stars Mobiler'
  ManagedBy: 'Bicep'
}
EOF

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file infra/main.bicep \
    --parameters infra/main.bicepparam

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Step 5: Get Deployment Token${NC}"
echo -e "${CYAN}========================================${NC}"

echo -e "${YELLOW}Retrieving deployment token...${NC}"

DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" \
    --output tsv)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "${CYAN}1. Add GitHub Secret:${NC}"
echo "   - Go to: GitHub Repository → Settings → Secrets and variables → Actions"
echo "   - Click 'New repository secret'"
echo "   - Name: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "   - Value: (see below)"
echo ""
echo -e "${YELLOW}Deployment Token:${NC}"
echo -e "${GREEN}$DEPLOYMENT_TOKEN${NC}"
echo ""
echo -e "${CYAN}2. Push to GitHub:${NC}"
echo "   git add ."
echo "   git commit -m 'Add Azure deployment configuration'"
echo "   git push origin main"
echo ""
echo -e "${CYAN}3. Your app will be available at:${NC}"

HOSTNAME=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" \
    --output tsv)

echo -e "   ${GREEN}https://$HOSTNAME${NC}"
echo ""
echo -e "${YELLOW}For detailed instructions, see DEPLOYMENT.md${NC}"
echo ""
