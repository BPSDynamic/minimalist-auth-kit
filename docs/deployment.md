# 🚀 CloudVault Deployment Guide

## **Overview**

This guide provides step-by-step instructions for deploying CloudVault to AWS using Infrastructure as Code (IaC) with AWS CDK and Amplify Gen 2.

## **Prerequisites**

### **Required Tools**
- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **AWS CLI**: 2.x or later
- **AWS CDK**: 2.x or later
- **AWS Amplify CLI**: Latest version
- **Git**: For version control

### **AWS Account Setup**
- AWS Account with appropriate permissions
- IAM user with programmatic access
- AWS CLI configured with credentials
- Appropriate AWS service limits

### **Required AWS Services**
- **IAM**: For roles and policies
- **Cognito**: For user authentication
- **S3**: For file storage
- **DynamoDB**: For metadata storage
- **Lambda**: For serverless functions
- **API Gateway**: For REST API
- **CloudWatch**: For monitoring
- **SES**: For email notifications
- **SNS**: For SMS notifications
- **KMS**: For encryption keys

## **Environment Setup**

### **1. Clone Repository**
```bash
git clone https://github.com/your-username/cloudvault.git
cd cloudvault
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Install AWS CDK**
```bash
npm install -g aws-cdk
```

### **4. Install AWS Amplify CLI**
```bash
npm install -g @aws-amplify/cli-core
```

### **5. Configure AWS CLI**
```bash
aws configure
```

Enter your AWS credentials:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `eu-west-1`)
- Default output format (`json`)

## **Infrastructure Deployment**

### **1. CDK Bootstrap (First Time Only)**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

Replace `ACCOUNT-NUMBER` with your AWS account ID and `REGION` with your preferred region.

### **2. Deploy Infrastructure**
```bash
# Deploy development environment
cdk deploy CloudVault-Dev --require-approval never

# Deploy staging environment
cdk deploy CloudVault-Staging --require-approval never

# Deploy production environment
cdk deploy CloudVault-Prod --require-approval never
```

### **3. Verify Deployment**
```bash
# List deployed stacks
cdk list

# Check stack status
aws cloudformation describe-stacks --stack-name CloudVault-Dev
```

## **Application Deployment**

### **1. Deploy Backend Services**
```bash
# Deploy Amplify backend
npx ampx sandbox deploy
```

### **2. Build Frontend**
```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### **3. Deploy Frontend**

#### **Option A: AWS Amplify Hosting**
```bash
# Initialize Amplify hosting
npx ampx add hosting

# Deploy to Amplify
npx ampx publish
```

#### **Option B: S3 + CloudFront**
```bash
# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### **Option C: Manual S3 Upload**
```bash
# Create S3 bucket
aws s3 mb s3://cloudvault-frontend-prod

# Upload files
aws s3 sync dist/ s3://cloudvault-frontend-prod --delete

# Set bucket policy for static website hosting
aws s3 website s3://cloudvault-frontend-prod --index-document index.html --error-document index.html
```

## **Environment Configuration**

### **1. Environment Variables**

Create environment-specific configuration files:

#### **Development (.env.development)**
```env
VITE_APP_ENV=development
VITE_APP_REGION=eu-west-1
VITE_APP_USER_POOL_ID=eu-west-1_XXXXXXXXX
VITE_APP_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_APP_IDENTITY_POOL_ID=eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_APP_S3_BUCKET=cloudvault-storage-dev
VITE_APP_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.eu-west-1.amazonaws.com/prod
VITE_APP_CLOUDFRONT_URL=https://dxxxxxxxxxxxxx.cloudfront.net
```

#### **Production (.env.production)**
```env
VITE_APP_ENV=production
VITE_APP_REGION=eu-west-1
VITE_APP_USER_POOL_ID=eu-west-1_XXXXXXXXX
VITE_APP_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_APP_IDENTITY_POOL_ID=eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_APP_S3_BUCKET=cloudvault-storage-prod
VITE_APP_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.eu-west-1.amazonaws.com/prod
VITE_APP_CLOUDFRONT_URL=https://dxxxxxxxxxxxxx.cloudfront.net
```

### **2. Update Amplify Configuration**

The `amplify_outputs.json` file is automatically generated during deployment. Ensure it contains all required service configurations:

```json
{
  "version": "1",
  "auth": {
    "user_pool_id": "eu-west-1_XXXXXXXXX",
    "user_pool_client_id": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "identity_pool_id": "eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "region": "eu-west-1"
  },
  "storage": {
    "aws_region": "eu-west-1",
    "bucket": "cloudvault-storage-prod"
  },
  "custom": {
    "api_gateway_url": "https://xxxxxxxxxx.execute-api.eu-west-1.amazonaws.com/prod",
    "cloudfront_url": "https://dxxxxxxxxxxxxx.cloudfront.net"
  }
}
```

## **Database Setup**

### **1. DynamoDB Tables**

The CDK deployment automatically creates the required DynamoDB tables:

- **CloudVault-Users-{env}**: User profiles and account information
- **CloudVault-Folders-{env}**: Folder metadata and structure
- **CloudVault-Files-{env}**: File metadata and information
- **CloudVault-ShareLinks-{env}**: File sharing links and permissions
- **CloudVault-Analytics-{env}**: User activity and analytics data

### **2. Verify Table Creation**
```bash
# List DynamoDB tables
aws dynamodb list-tables

# Check table details
aws dynamodb describe-table --table-name CloudVault-Users-prod
```

## **Lambda Functions Deployment**

### **1. Deploy Lambda Functions**
```bash
# Deploy all functions
npm run deploy:lambda

# Deploy specific function
npm run deploy:lambda:fileProcessor
npm run deploy:lambda:folderService
npm run deploy:lambda:analyticsService
npm run deploy:lambda:notificationService
```

### **2. Verify Function Deployment**
```bash
# List Lambda functions
aws lambda list-functions

# Check function details
aws lambda get-function --function-name CloudVault-FileProcessor-prod
```

## **Monitoring Setup**

### **1. CloudWatch Dashboards**

Create custom dashboards for monitoring:

```bash
# Create dashboard
aws cloudwatch put-dashboard --dashboard-name CloudVault-Prod --dashboard-body file://monitoring/dashboard.json
```

### **2. Alarms Configuration**

Set up CloudWatch alarms for critical metrics:

```bash
# Create high error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "CloudVault-High-Error-Rate" \
  --alarm-description "High error rate detected" \
  --metric-name "ErrorCount" \
  --namespace "CloudVault" \
  --statistic "Sum" \
  --period 300 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2
```

### **3. Log Groups**

Ensure log groups are created for all Lambda functions:

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/CloudVault"
```

## **Security Configuration**

### **1. IAM Roles and Policies**

Verify that all required IAM roles are created:

```bash
# List IAM roles
aws iam list-roles --query 'Roles[?contains(RoleName, `CloudVault`)]'

# Check role policies
aws iam list-attached-role-policies --role-name CloudVault-LambdaExecutionRole-prod
```

### **2. S3 Bucket Policies**

Ensure S3 buckets have proper policies:

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket cloudvault-storage-prod
```

### **3. CORS Configuration**

Configure CORS for API Gateway and S3:

```bash
# Update API Gateway CORS
aws apigateway put-gateway-response \
  --rest-api-id YOUR_API_ID \
  --response-type DEFAULT_4XX \
  --response-parameters '{"gatewayresponse.header.Access-Control-Allow-Origin":"true"}'
```

## **Testing Deployment**

### **1. Health Checks**

Create health check endpoints:

```bash
# Test API health
curl https://your-api-gateway-url.amazonaws.com/prod/health

# Test authentication
curl -X POST https://your-api-gateway-url.amazonaws.com/prod/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

### **2. Integration Tests**

Run integration tests to verify deployment:

```bash
# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### **3. Load Testing**

Perform load testing to ensure scalability:

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-tests/api-load-test.yml
```

## **CI/CD Pipeline Setup**

### **1. GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy CloudVault
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  deploy-dev:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      - run: npm ci
      - run: npm run build
      - run: cdk deploy CloudVault-Dev --require-approval never

  deploy-prod:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      - run: npm ci
      - run: npm run build
      - run: cdk deploy CloudVault-Prod --require-approval never
```

### **2. Environment Secrets**

Configure GitHub secrets:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region
- `COGNITO_USER_POOL_ID`: Cognito user pool ID
- `S3_BUCKET_NAME`: S3 bucket name

## **Troubleshooting**

### **Common Issues**

#### **1. CDK Deployment Fails**
```bash
# Check CDK version
cdk --version

# Bootstrap CDK
cdk bootstrap

# Check AWS credentials
aws sts get-caller-identity
```

#### **2. Lambda Function Errors**
```bash
# Check function logs
aws logs tail /aws/lambda/CloudVault-FileProcessor-prod --follow

# Check function configuration
aws lambda get-function --function-name CloudVault-FileProcessor-prod
```

#### **3. DynamoDB Access Issues**
```bash
# Check table permissions
aws dynamodb describe-table --table-name CloudVault-Users-prod

# Test table access
aws dynamodb scan --table-name CloudVault-Users-prod --limit 1
```

#### **4. S3 Access Issues**
```bash
# Check bucket permissions
aws s3api get-bucket-policy --bucket cloudvault-storage-prod

# Test bucket access
aws s3 ls s3://cloudvault-storage-prod/
```

### **Debug Commands**

```bash
# Check all resources
aws cloudformation describe-stack-resources --stack-name CloudVault-Prod

# Check API Gateway
aws apigateway get-rest-apis

# Check Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `CloudVault`)]'

# Check DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `CloudVault`)]'

# Check S3 buckets
aws s3 ls | grep cloudvault
```

## **Rollback Procedures**

### **1. Rollback Infrastructure**
```bash
# Rollback to previous version
cdk deploy CloudVault-Prod --rollback

# Or destroy and redeploy
cdk destroy CloudVault-Prod
cdk deploy CloudVault-Prod
```

### **2. Rollback Application**
```bash
# Rollback to previous deployment
aws s3 sync s3://cloudvault-frontend-prod-backup/ s3://cloudvault-frontend-prod/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## **Maintenance**

### **1. Regular Updates**
```bash
# Update dependencies
npm update

# Update CDK
npm update -g aws-cdk

# Update Amplify CLI
npm update -g @aws-amplify/cli-core
```

### **2. Security Updates**
```bash
# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix

# Update AWS services
aws service-quotas get-service-quota --service-code lambda --quota-code L-B99A9384
```

### **3. Performance Monitoring**
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "Duration" \
  --dimensions Name=FunctionName,Value=CloudVault-FileProcessor-prod \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

---

This deployment guide provides comprehensive instructions for deploying CloudVault to AWS with proper monitoring, security, and maintenance procedures.
