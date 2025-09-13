#!/bin/bash

# CloudVault Enterprise Deployment Script
echo "🚀 Deploying CloudVault Enterprise with Lambda Functions..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Amplify CLI is installed
if ! command -v npx @aws-amplify/cli-core &> /dev/null; then
    echo "📦 Installing Amplify CLI..."
    npm install -g @aws-amplify/cli-core
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Deploy the backend with Lambda functions
echo "☁️ Deploying backend with Lambda functions..."
npx @aws-amplify/cli-core sandbox deploy

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed"
    exit 1
fi

# Get the deployment outputs
echo "📋 Getting deployment outputs..."
npx @aws-amplify/cli-core sandbox outputs

# Update Lambda service URLs
echo "🔧 Updating Lambda service URLs..."
node scripts/update-lambda-urls.js

echo "✅ CloudVault Enterprise deployment completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Configure API Gateway endpoints"
echo "2. Set up SES for email notifications"
echo "3. Configure SNS for push notifications"
echo "4. Set up CloudWatch monitoring"
echo "5. Configure backup policies"
echo ""
echo "📊 Access your enterprise dashboard at: /dashboard/enterprise"
