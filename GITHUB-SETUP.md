# GitHub Setup Guide

This guide helps you set up your GitHub repository for automatic deployment to Azure Static Web Apps.

## Prerequisites

- GitHub account
- Git installed locally
- Repository created on GitHub (or ready to create)

## Option 1: New Repository

If you haven't created a GitHub repository yet:

### 1. Create Repository on GitHub

1. Go to [GitHub](https://github.com/new)
2. Repository name: `stars-mobiler` (or your preferred name)
3. Description: "Modern Angular 21 implementation of the classic Stars! 4X strategy game"
4. Visibility: Public or Private
5. **Do NOT** initialize with README, .gitignore, or license (already exists locally)
6. Click "Create repository"

### 2. Connect Local Repository

```bash
# Initialize git (if not already done)
cd /path/to/stars-mobiler
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with Azure deployment configuration"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/stars-mobiler.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Option 2: Existing Repository

If you already have a repository:

### Update Repository

```bash
# Add new files
git add .

# Commit changes
git commit -m "Add Azure Static Web Apps deployment configuration"

# Push to GitHub
git push origin main
```

## Configure GitHub Secrets

After deploying to Azure (see [DEPLOYMENT.md](DEPLOYMENT.md)), you'll need to add the deployment token as a GitHub secret:

### 1. Get Deployment Token

```bash
# Option A: From deployment script output
# The token is displayed at the end of running scripts/deploy-azure.sh or scripts/deploy-azure.ps1

# Option B: Retrieve manually
az staticwebapp secrets list \
  --name stars-mobiler \
  --resource-group rg-stars-mobiler \
  --query "properties.apiKey" \
  --output tsv
```

### 2. Add Secret to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: Paste the deployment token from step 1
6. Click **Add secret**

## Enable GitHub Actions

GitHub Actions should automatically be enabled, but verify:

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", ensure "Allow all actions and reusable workflows" is selected
3. Click **Save**

## Trigger Deployment

### Automatic Deployment

Deployments trigger automatically on:
- Push to `main` branch
- Pull request opened/updated to `main` branch

### Manual Deployment

1. Go to **Actions** tab
2. Select "Azure Static Web Apps CI/CD" workflow
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow**

## Monitor Deployment

### View Workflow Status

1. Go to **Actions** tab
2. Click on the latest workflow run
3. Expand build steps to see detailed logs

### Common Issues

#### Build Fails

**Problem**: Build fails with "npm install" error

**Solution**:
```bash
# Test build locally
npm install
npm run build

# If successful, commit package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

#### Deployment Token Invalid

**Problem**: "Error: Invalid deployment token"

**Solution**:
1. Get new deployment token (see above)
2. Update GitHub secret with new token
3. Re-run workflow

#### 404 on Deployed Site

**Problem**: Routes show 404 error

**Solution**: Ensure `staticwebapp.config.json` exists (already included in this setup)

## Branch Protection (Optional)

For team projects, enable branch protection:

1. **Settings** → **Branches**
2. Add branch protection rule for `main`
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Add status check: `Build and Deploy`

## Pull Request Previews

Each pull request automatically creates a staging environment:

- URL format: `https://<app-name>-<pr-number>.azurestaticapps.net`
- Automatically deployed when PR is opened/updated
- Automatically deleted when PR is closed/merged
- Perfect for testing changes before merging

## Update README

Don't forget to update your README.md with your actual GitHub username:

1. Open [README.md](README.md)
2. Replace `YOUR_USERNAME` with your GitHub username in:
   - Badge URLs
   - Clone command
   - Issue/Discussion links

Example:
```markdown
[![Azure Static Web Apps CI/CD](https://github.com/yourusername/stars-mobiler/actions/workflows/azure-static-web-apps-deploy.yml/badge.svg)]
```

## Repository Settings Checklist

- [x] Repository created on GitHub
- [x] Local repository connected
- [x] Initial commit pushed
- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` secret added
- [ ] GitHub Actions enabled
- [ ] First deployment successful
- [ ] README.md updated with your username
- [ ] Repository description added
- [ ] Topics/tags added (angular, azure, game, typescript)

## Adding Collaborators

To add team members:

1. **Settings** → **Collaborators and teams**
2. Click **Add people**
3. Enter GitHub username
4. Select role (Write for contributors, Admin for maintainers)
5. Click **Add to this repository**

## Next Steps

After GitHub setup:

1. ✅ Test the deployment pipeline
2. ✅ Create your first pull request
3. ✅ Configure custom domain (optional, see [DEPLOYMENT.md](DEPLOYMENT.md))
4. ✅ Add project board for issue tracking
5. ✅ Enable Dependabot for security updates

## Resources

- [GitHub Docs: Creating a Repository](https://docs.github.com/en/repositories/creating-and-managing-repositories)
- [GitHub Docs: Managing Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps: GitHub Integration](https://docs.microsoft.com/azure/static-web-apps/github-actions-workflow)
