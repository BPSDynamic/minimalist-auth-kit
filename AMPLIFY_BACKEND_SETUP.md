# AWS Amplify Gen 2 Backend Setup Guide

## 🚀 Quick Start

### 1. Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 2. Deploy Amplify Backend
```bash
# Deploy the sandbox environment
npm run amplify:deploy

# This will create:
# - Cognito User Pool for authentication
# - S3 bucket for file storage  
# - DynamoDB tables for data
# - AppSync GraphQL API
```

### 3. Get Backend Configuration
After deployment, you'll get an `amplify_outputs.json` file with all the backend configuration details.

## 📁 Backend Structure

```
amplify/
├── backend.ts          # Main backend configuration
├── auth/
│   └── resource.ts     # Cognito authentication setup
├── storage/
│   └── resource.ts     # S3 storage configuration
└── data/
    └── resource.ts     # DynamoDB + AppSync schema
```

## 🔐 Authentication Features

- **Email/Password Sign Up**: With email verification
- **User Attributes**: First name, last name, email
- **Password Policy**: 8+ chars, mixed case, numbers, symbols
- **MFA Support**: Optional TOTP
- **Account Recovery**: Email-based

## 📊 Database Schema

### User Model
- Profile information
- Storage usage tracking
- Account settings

### Folder Model
- Hierarchical folder structure
- File type restrictions
- Confidentiality levels
- Sharing permissions

### File Model
- File metadata
- S3 storage references
- Tags and classifications
- Download tracking

### ShareLink Model
- Secure file sharing
- Expiration dates
- Download limits
- Access tracking

### Analytics Model
- User activity tracking
- Storage usage analytics
- File operation logs

## 🗄️ Storage Structure

```
S3 Bucket:
├── user-files/
│   └── {user_id}/
│       ├── documents/
│       ├── images/
│       └── videos/
├── shared-files/
│   └── {share_token}/
└── public-files/
    └── {public_id}/
```

## 🔄 Deployment Commands

```bash
# Deploy sandbox
npm run amplify:deploy

# Delete sandbox
npm run amplify:delete

# Generate outputs (after deployment)
npm run amplify:generate
```

## 📝 Backend Configuration

After deployment, you'll get these configuration values in `amplify_outputs.json`:

```json
{
  "version": "1",
  "auth": {
    "user_pool_id": "us-east-1_XXXXXXXXX",
    "user_pool_client_id": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "identity_pool_id": "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "aws_region": "us-east-1"
  },
  "storage": {
    "aws_region": "us-east-1",
    "bucket_name": "cloudvault-storage-xxxxxxxxx"
  },
  "data": {
    "aws_region": "us-east-1",
    "url": "https://xxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql",
    "api_key": "da2-xxxxxxxxxxxxxxxxxxxxxx",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS"
  }
}
```

## 🔗 Frontend Integration

To connect your existing frontend to this backend:

1. **Install AWS SDK**: `npm install aws-amplify`
2. **Configure Amplify**: Use the `amplify_outputs.json` values
3. **Update Auth Components**: Connect your existing auth forms to Cognito
4. **Add File Operations**: Use S3 for file uploads/downloads
5. **Database Operations**: Use AppSync GraphQL for data operations

## 🛠️ Next Steps

1. **Deploy Backend**: Run `npm run amplify:deploy`
2. **Test Authentication**: Create test users in Cognito
3. **Test Storage**: Upload files to S3
4. **Test Database**: Create/read data via AppSync
5. **Connect Frontend**: Integrate with your existing UI

## 📋 Environment Variables

After deployment, you can use these in your frontend:

```env
VITE_AMPLIFY_REGION=us-east-1
VITE_AMPLIFY_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_AMPLIFY_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AMPLIFY_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AMPLIFY_S3_BUCKET=cloudvault-storage-xxxxxxxxx
VITE_AMPLIFY_APPSYNC_URL=https://xxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql
```

## 🔒 Security Notes

- All data is protected by Cognito User Pools
- S3 access is restricted per user
- GraphQL API uses user-based authorization
- File sharing uses secure tokens with expiration
