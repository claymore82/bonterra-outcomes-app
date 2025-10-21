# AWS Bootstrap CloudFormation Templates

These CloudFormation templates set up the AWS infrastructure needed for bonstart deployments via GitHub Actions.

## Files

- `GitHubActionsRole.yaml` - Creates IAM role for GitHub Actions with all necessary SST permissions

## Overview

This setup uses **OIDC (OpenID Connect)** to allow GitHub Actions to assume an IAM role in your AWS account without storing AWS credentials in GitHub. This is more secure than using long-lived access keys.

**Flow**: GitHub Action → OIDC Token → AWS STS → Assume IAM Role → Deploy with SST

## Quick Setup

### 1. Check if OIDC Provider exists (one-time per AWS account)

```bash
# Check if GitHub OIDC provider already exists
aws iam list-open-id-connect-providers | grep token.actions.githubusercontent.com
```

If it doesn't exist, create it:
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2. Deploy GitHub Actions Role

Deploy **one role per environment** in your AWS account. For most setups, you'll deploy to a **single AWS account** and use SST stages to isolate resources.

**For single AWS account (recommended for most teams):**

```bash
# Navigate to the CloudFormation template directory
cd .github/bootstrap-cloudformation

# Deploy the role (replace YOUR_ORG/YOUR_REPO with your actual GitHub repo)
aws cloudformation deploy \
  --template-file GitHubActionsRole.yaml \
  --stack-name bonstart-github-actions-role \
  --parameter-overrides GitHubRepo=bonterratech/your-project-name \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Get the role ARN (you'll need this for GitHub)
aws cloudformation describe-stacks \
  --stack-name bonstart-github-actions-role \
  --query 'Stacks[0].Outputs[?OutputKey==`GitHubActionsRoleARN`].OutputValue' \
  --output text
```

**For multi-account setup (prod in separate account):**

Deploy separate roles in each AWS account with the same repo parameter.

### 3. Configure GitHub Repository

#### Step 1: Create GitHub Environments

Go to your GitHub repo → **Settings** → **Environments** → **New environment**

Create these three environments:
- `prod` (for main branch)
- `develop` (for develop branch)
- `ephemeral` (for feature branches)

#### Step 2: Add Environment Variables

**IMPORTANT**: You must create these environments in your GitHub repository settings (Settings → Environments) or deployments will fail.

#### Current Branch Mapping:
- **`main` branch** → `prod` environment → Production AWS resources
- **`develop` branch** → `develop` environment → Development AWS resources
- **All other branches** → `ephemeral` environment → Temporary AWS resources

For each environment, add these **Variables** (not secrets):

**All environments** (if using single AWS account):
- **AWS_ROLE**: `arn:aws:iam::123456789012:role/bonstart-github-actions-role-GithubActionsRole`
- **AWS_REGION**: `us-east-1`

Replace `123456789012` with your actual AWS account ID (from the CloudFormation output above).

**If using separate AWS accounts:**
- `prod`: Use prod account role ARN
- `develop` & `ephemeral`: Use dev account role ARN

## Testing Your Setup

### Test 1: Verify CloudFormation Deployment

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name bonstart-github-actions-role

# Verify role exists
aws iam get-role --role-name bonstart-github-actions-role-GithubActionsRole
```

### Test 2: Test Local Deployment (before GitHub Actions)

```bash
# Set up AWS credentials locally (not needed for GitHub Actions)
aws configure --profile your-profile

# Test SST deployment
npm run sst:deploy -- --stage your-name-test

# This tests that:
# - SST can deploy to AWS
# - All required services (S3, Lambda, CloudFront) work
# - Resource naming is correct
```

### Test 3: Test GitHub Actions Deployment

**Push to a feature branch** and watch the GitHub Actions workflow:

```bash
git checkout -b test-deployment
git commit --allow-empty -m "Test GitHub Actions deployment"
git push origin test-deployment
```

**Monitor**: Go to GitHub → Actions tab → Watch the "Deploy" workflow

**Expected flow:**
1. ✅ Select environment: `ephemeral`
2. ✅ Configure AWS Credentials (assumes role via OIDC)
3. ✅ Install dependencies
4. ✅ Deploy with SST (creates resources with stage name from branch)
5. ✅ Deployment summary shows CloudFront URL

### Test 4: Verify AWS Resources

```bash
# List S3 buckets created by SST
aws s3 ls | grep bonstart-template-replace-me

# List Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `bonstart-template-replace-me`)]'

# List CloudFront distributions
aws cloudfront list-distributions --query 'DistributionList.Items[].{Id:Id,Domain:DomainName,Comment:Comment}' --output table
```

## Troubleshooting

### "User is not authorized to perform: sts:AssumeRoleWithWebIdentity"

**Cause**: OIDC provider doesn't exist or GitHub repo parameter is wrong.

**Fix**:
```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Verify role trust policy has correct repo
aws iam get-role --role-name bonstart-github-actions-role-GithubActionsRole \
  --query 'Role.AssumeRolePolicyDocument'
```

### "Error: Could not assume role"

**Cause**: Environment variables not set in GitHub or wrong ARN.

**Fix**: 
- Check GitHub repo → Settings → Environments → Variables
- Verify `AWS_ROLE` matches CloudFormation output exactly

### "AccessDenied" during deployment

**Cause**: IAM role missing permissions.

**Fix**: Check CloudFormation template permissions match what SST needs. Common missing permissions:
- `cloudfront:CreateCachePolicy` (if creating custom policies)
- `dynamodb:*` (if using DynamoDB)
- `ssm:PutParameter` (for SST state)

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
3. **Deploy staging CloudFormation stack**:
   ```bash
   aws cloudformation deploy \
     --template-file GitHubActionsRole.yaml \
     --stack-name bonstart-template-staging-github-role \
     --parameter-overrides GitHubRepo=YOUR_ORG/bonstart \
     --capabilities CAPABILITY_NAMED_IAM
   ```
4. **Create staging GitHub environment** with staging AWS role ARN

