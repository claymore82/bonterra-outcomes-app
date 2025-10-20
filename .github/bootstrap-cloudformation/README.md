# AWS Bootstrap CloudFormation Templates

These CloudFormation templates set up the AWS infrastructure needed for bonstart deployments via GitHub Actions.

## Files

- `GitHubActionsRole.yaml` - Creates IAM role for GitHub Actions with all necessary SST permissions
- `CloudFrontCachePolicy.yaml` - Creates shared CloudFront cache policy to avoid naming conflicts

## Quick Setup

### 1. Deploy OIDC Provider (one-time setup)
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2. Deploy Cache Policy (optional, one-time setup)
```bash
aws cloudformation deploy \
  --template-file CloudFrontCachePolicy.yaml \
  --stack-name bonstart-template-cache-policy
```

### 3. Deploy GitHub Actions Roles

Deploy **one role per AWS account**:

#### Development/Staging Account
```bash
aws cloudformation deploy \
  --template-file GitHubActionsRole.yaml \
  --stack-name {{APP_NAME}}-dev-github-role \
  --parameter-overrides \
    GitHubRepo={{GITHUB_ORG}}/{{REPO_NAME}} \
  --capabilities CAPABILITY_NAMED_IAM
```

#### Production Account (different AWS account)
```bash
aws cloudformation deploy \
  --template-file GitHubActionsRole.yaml \
  --stack-name {{APP_NAME}}-prod-github-role \
  --parameter-overrides \
    GitHubRepo={{GITHUB_ORG}}/{{REPO_NAME}} \
  --capabilities CAPABILITY_NAMED_IAM
```

### 4. Create GitHub Environments & Configure Variables

**IMPORTANT**: You must create these environments in your GitHub repository settings (Settings → Environments) or deployments will fail.

#### Current Branch Mapping:
- **`main` branch** → `prod` environment → **Production AWS account**
- **`develop` branch** → `develop` environment → Development AWS account
- **All other branches** → `ephemeral` environment → Development AWS account

Configure these environment variables in GitHub:

#### Production Environment (`prod`)
- **AWS_ROLE**: `arn:aws:iam::{{PROD_ACCOUNT_ID}}:role/{{APP_NAME}}-prod-github-role-GithubActionsRole`
- **AWS_REGION**: `us-east-1`

#### Development Environment (`develop`)
- **AWS_ROLE**: `arn:aws:iam::{{DEV_ACCOUNT_ID}}:role/{{APP_NAME}}-dev-github-role-GithubActionsRole`
- **AWS_REGION**: `us-east-1`

#### Ephemeral Environment (`ephemeral`)
- **AWS_ROLE**: `arn:aws:iam::{{DEV_ACCOUNT_ID}}:role/{{APP_NAME}}-dev-github-role-GithubActionsRole`
- **AWS_REGION**: `us-east-1`

## URLs and Domains

The bonstart template uses **CloudFront domains** by default for simplicity:

### All Stages
- All deployments get CloudFront URLs automatically
- No domain setup or DNS management required
- Example URLs:
  - Production: `https://d1234567890.cloudfront.net`
  - Development: `https://d0987654321.cloudfront.net`
  - Feature branches: `https://dabcdef1234.cloudfront.net`

### Custom Domains (Optional)
If you want custom domains later, you can:
1. Add domain configuration to `sst.config.ts`
2. Update the CloudFormation template to include Route53/ACM permissions
3. Manage SSL certificates and DNS records separately

This keeps the template simple and gets you up and running immediately without any domain prerequisites.

## Parameters

### GitHubActionsRole.yaml Parameters:
- `GitHubRepo`: GitHub repository in format "owner/repo" (e.g., "myorg/bonstart")

## Permissions Included

The IAM role includes permissions for:
- **S3**: Bucket operations for static assets
- **Lambda**: Function management for SSR and image optimization
- **CloudFront**: Distribution and cache policy management
- **IAM**: Role creation for Lambda execution
- **CloudWatch Logs**: Log group management
- **SQS**: Queue operations for ISR events
- **DynamoDB**: Table operations (ready for future use)

## What SST Actually Uses

Based on analysis of actual SST deployments, the basic Next.js component uses:
- **S3**: Static assets bucket (`*-siteassetsbucket-*`)
- **Lambda**: Server function, image optimizer, revalidation functions
- **CloudFront**: Distribution with cache policy
- **SQS**: Revalidation events queue
- **DynamoDB**: Revalidation cache table
- **IAM**: Execution roles for Lambda functions
- **CloudWatch**: Log groups for functions

## Included for Future Use

- **SSM**: Parameter store for SST Secrets (ready when you add `new sst.Secret()`)

## Optional: Add Staging Environment

The current setup only includes `prod`, `develop`, and `ephemeral` environments. To add staging:

1. **Create staging branch**: `git checkout -b staging`
2. **Update branch mapping** in `.github/workflows/select-environment.yml`:
   ```javascript
   const branchToEnvironment = {
       'main': 'prod',
       'staging': 'staging',    // Add this line
       'develop': 'develop'
   };
   ```
3. **Create staging GitHub environment** with the same AWS role ARN (no additional CloudFormation needed)

## Cleanup

To remove resources:
```bash
# Remove GitHub Actions role
aws cloudformation delete-stack --stack-name bonstart-template-github-role

# Remove shared cache policy (optional)
aws cloudformation delete-stack --stack-name bonstart-template-cache-policy
```
