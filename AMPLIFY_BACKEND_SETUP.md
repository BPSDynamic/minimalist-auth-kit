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
npx ampx sandbox deploy

# This will create:
# - Cognito User Pool for authentication
# - S3 bucket for file storage  
# - DynamoDB tables for data
# - AppSync GraphQL API
# - IAM roles and policies
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
- **Account Recovery**: Email-based password reset
- **Session Management**: Automatic session handling and cleanup
- **Real-time Auth State**: Hub-based auth state updates

## 📊 Database Schema

### User Model
- Profile information (firstName, lastName, email)
- Storage usage tracking
- Account settings and preferences
- File and folder relationships

### File Model
- File metadata (name, type, size, s3Key)
- Folder relationships
- Tags and classifications
- Confidentiality and importance levels
- Sharing permissions and metadata
- Sender information for shared files

### SharedFile Model
- Secure file sharing with recipients
- Expiration dates and access limits
- Custom messages and sender info
- Share link generation and tracking
- Download analytics

### Folder Model
- Hierarchical folder structure
- File type restrictions
- Confidentiality levels
- Sharing permissions
- Metadata storage

## 🗄️ Storage Structure

```
S3 Bucket: amplify-minimalistauthkit-cloudvaultstoragebuckete-imgg9agmjq4j
├── user-files/
│   └── {user_id}/
│       ├── files/
│       └── folders/
├── shared-files/
│   └── {file_id}/
├── metadata/
│   ├── files/
│   │   └── {file_id}.json
│   └── folders/
│       └── {folder_name}.json
└── public/
    └── shared/
        └── {file_id}/
```

## 🔄 Deployment Commands

```bash
# Deploy sandbox (recommended for development)
npx ampx sandbox deploy

# Deploy to production (when ready)
npx ampx pipeline-deploy --branch main

# Delete sandbox
npx ampx sandbox delete

# Generate outputs (after deployment)
npx ampx generate outputs --app-id YOUR_APP_ID --branch main
```

## 📝 Current Backend Configuration

After deployment, you'll get these configuration values in `amplify_outputs.json`:

```json
{
  "version": "1",
  "auth": {
    "user_pool_id": "eu-west-1_qmydSb2rp",
    "user_pool_client_id": "61idhf70v5hmlknkclremo2anp",
    "identity_pool_id": "eu-west-1:b508ee26-7cde-41ee-9cb2-5e0444e9cbf6",
    "aws_region": "eu-west-1",
    "password_policy": {
      "min_length": 8,
      "require_lowercase": true,
      "require_numbers": true,
      "require_symbols": true,
      "require_uppercase": true
    }
  },
  "storage": {
    "aws_region": "eu-west-1",
    "bucket_name": "amplify-minimalistauthkit-cloudvaultstoragebuckete-imgg9agmjq4j"
  },
  "data": {
    "aws_region": "eu-west-1",
    "url": "https://mtdnbhvqibephi2skrgsgsjipe.appsync-api.eu-west-1.amazonaws.com/graphql",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS",
    "authorization_types": ["AWS_IAM"]
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

### Example Frontend Configuration

```typescript
// src/lib/amplify.ts
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

export default Amplify;
```

## 🛠️ Backend Services

### AWS Cognito User Pool
- **User Pool ID**: `eu-west-1_qmydSb2rp`
- **Client ID**: `61idhf70v5hmlknkclremo2anp`
- **Identity Pool ID**: `eu-west-1:b508ee26-7cde-41ee-9cb2-5e0444e9cbf6`
- **Region**: `eu-west-1` (Europe - Ireland)

### AWS S3 Storage
- **Bucket Name**: `amplify-minimalistauthkit-cloudvaultstoragebuckete-imgg9agmjq4j`
- **Region**: `eu-west-1`
- **Access Levels**: `guest`, `protected`, `private`
- **Features**: File upload, download, sharing, metadata storage

### AWS AppSync GraphQL API
- **API URL**: `https://mtdnbhvqibephi2skrgsgsjipe.appsync-api.eu-west-1.amazonaws.com/graphql`
- **Region**: `eu-west-1`
- **Authorization**: Cognito User Pools + IAM
- **Features**: Real-time subscriptions, offline support

## 🔒 Security Features

### Authentication Security
- **Password Policy**: Enforced by Cognito (8+ chars, mixed case, numbers, symbols)
- **Email Verification**: Required for account activation
- **Session Management**: Automatic cleanup and conflict resolution
- **Token Refresh**: Automatic handling of expired tokens
- **Secure Storage**: All sensitive data handled by AWS Cognito

### File Storage Security
- **User Isolation**: Each user's files are completely isolated
- **Access Control**: S3 access restricted per user via IAM
- **Encryption**: All files encrypted at rest in S3
- **Secure Sharing**: Time-limited, recipient-specific share links
- **Audit Trail**: All file operations logged

### API Security
- **GraphQL API**: Uses Cognito User Pools for authorization
- **IAM Roles**: Fine-grained permissions for S3 access
- **CORS**: Properly configured for web application access
- **Rate Limiting**: Built-in protection against abuse

## 📋 Environment Variables

After deployment, you can use these in your frontend:

```env
VITE_AMPLIFY_REGION=eu-west-1
VITE_AMPLIFY_USER_POOL_ID=eu-west-1_qmydSb2rp
VITE_AMPLIFY_USER_POOL_CLIENT_ID=61idhf70v5hmlknkclremo2anp
VITE_AMPLIFY_IDENTITY_POOL_ID=eu-west-1:b508ee26-7cde-41ee-9cb2-5e0444e9cbf6
VITE_AMPLIFY_S3_BUCKET=amplify-minimalistauthkit-cloudvaultstoragebuckete-imgg9agmjq4j
VITE_AMPLIFY_APPSYNC_URL=https://mtdnbhvqibephi2skrgsgsjipe.appsync-api.eu-west-1.amazonaws.com/graphql
```

## 🚀 Deployment Status

### ✅ Currently Deployed
- [x] AWS Cognito User Pool
- [x] S3 Bucket with proper permissions
- [x] AppSync GraphQL API
- [x] IAM roles and policies
- [x] Frontend integration
- [x] File upload/download functionality
- [x] Folder management system
- [x] File sharing with metadata
- [x] Automatic sender information

### 🚧 Ready for Production
- [x] Authentication system
- [x] File management
- [x] Sharing system
- [x] Security implementation
- [x] Error handling
- [x] Session management

## 🛠️ Next Steps

1. **Deploy Backend**: Run `npx ampx sandbox deploy`
2. **Test Authentication**: Create test users in Cognito
3. **Test Storage**: Upload files to S3
4. **Test Database**: Create/read data via AppSync
5. **Connect Frontend**: Integrate with your existing UI
6. **Deploy to Production**: Use `npx ampx pipeline-deploy`

## 🔧 Monitoring and Maintenance

### CloudWatch Logs
- Authentication events
- File upload/download logs
- API request logs
- Error tracking

### S3 Monitoring
- Storage usage metrics
- Access patterns
- Cost optimization
- Lifecycle policies

### Cognito Monitoring
- User registration trends
- Authentication success rates
- Failed login attempts
- Security events

## 📊 Cost Optimization

### S3 Storage
- Use lifecycle policies for old files
- Monitor storage usage per user
- Implement file compression
- Set up cost alerts

### Cognito Usage
- Monitor active users
- Optimize password policies
- Set up usage alerts
- Review MFA requirements

### AppSync API
- Monitor GraphQL query patterns
- Optimize data fetching
- Set up query caching
- Review subscription usage

## 🆘 Troubleshooting

### Common Issues

**1. Authentication Errors**
- Check Cognito User Pool configuration
- Verify email verification settings
- Review password policy requirements

**2. S3 Access Denied**
- Check IAM role permissions
- Verify S3 bucket policies
- Review access level configurations

**3. AppSync Errors**
- Check GraphQL schema
- Verify authorization rules
- Review API key configuration

**4. Deployment Issues**
- Check AWS credentials
- Verify region configuration
- Review resource limits

---

**Your AWS Amplify Gen 2 backend is ready for production! 🚀**