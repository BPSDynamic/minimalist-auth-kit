# CloudVault - AWS Amplify Gen 2 Integration Tutorial

A complete guide to integrating AWS Amplify Gen 2 with a React application for authentication, file storage, and database management.

## 🚀 Overview

This tutorial shows how to integrate AWS Amplify Gen 2 with a React application, including:
- **Authentication** with AWS Cognito
- **File Storage** with AWS S3
- **Database** with DynamoDB + AppSync GraphQL
- **Real-time features** and analytics

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS CLI configured
- AWS Account with appropriate permissions

## 🛠️ Installation & Setup

### 1. Install Amplify Dependencies

```bash
npm install aws-amplify @aws-amplify/backend @aws-amplify/backend-cli
```

### 2. Create Amplify Backend Structure

Create the following directory structure:

```
amplify/
├── backend.ts
├── auth/
│   └── resource.ts
├── storage/
│   └── resource.ts
└── data/
    └── resource.ts
```

### 3. Configure Authentication (Cognito)

Create `amplify/auth/resource.ts`:

```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Welcome to CloudVault! Verify your email!',
      verificationEmailBody: (code) => `
        <p>Hello,</p>
        <p>Thank you for registering with CloudVault. Please use the following code to verify your email address:</p>
        <h3>${code}</h3>
        <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The CloudVault Team</p>
      `,
    },
  },
  userAttributes: {
    givenName: {
      required: true,
    },
    familyName: {
      required: true,
    },
  },
  multiFactorAuthentication: {
    mode: 'OFF',
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    requireUppercase: true,
  },
});
```

### 4. Configure Storage (S3)

Create `amplify/storage/resource.ts`:

```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'CloudVaultStorageBucket',
  access: (allow) => ({
    'user-files/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'shared-files/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'public-files/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
  }),
});
```

### 5. Configure Database (DynamoDB + AppSync)

Create `amplify/data/resource.ts`:

```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      id: a.id().required(),
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      profilePicture: a.string(),
      storageUsed: a.integer().default(0),
      storageLimit: a.integer().default(15728640), // 15GB in bytes
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      folders: a.hasMany('Folder', ['userId']),
      files: a.hasMany('File', ['userId']),
      shareLinks: a.hasMany('ShareLink', ['userId']),
      analytics: a.hasMany('Analytics', ['userId']),
    })
    .authorization((allow) => [allow.owner()]),

  Folder: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      parentId: a.id(),
      userId: a.id().required(),
      allowedFileTypes: a.string().array(),
      confidentiality: a.enum(['public', 'internal', 'confidential', 'restricted']),
      importance: a.enum(['low', 'medium', 'high', 'critical']),
      allowSharing: a.boolean().default(true),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      parent: a.belongsTo('Folder', ['parentId']),
      children: a.hasMany('Folder', ['parentId']),
      files: a.hasMany('File', ['folderId']),
      user: a.belongsTo('User', ['userId']),
    })
    .authorization((allow) => [allow.owner()]),

  File: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      type: a.string().required(),
      size: a.integer().required(),
      s3Key: a.string().required(),
      folderId: a.id(),
      userId: a.id().required(),
      tags: a.string().array(),
      confidentiality: a.enum(['public', 'internal', 'confidential', 'restricted']),
      importance: a.enum(['low', 'medium', 'high', 'critical']),
      allowSharing: a.boolean().default(true),
      downloadCount: a.integer().default(0),
      lastAccessed: a.datetime(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      folder: a.belongsTo('Folder', ['folderId']),
      user: a.belongsTo('User', ['userId']),
      shareLinks: a.hasMany('ShareLink', ['fileId']),
    })
    .authorization((allow) => [allow.owner()]),

  ShareLink: a
    .model({
      id: a.id().required(),
      fileId: a.id().required(),
      userId: a.id().required(),
      token: a.string().required(),
      expiresAt: a.datetime(),
      downloadLimit: a.integer(),
      downloadCount: a.integer().default(0),
      isActive: a.boolean().default(true),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      file: a.belongsTo('File', ['fileId']),
      user: a.belongsTo('User', ['userId']),
    })
    .authorization((allow) => [allow.owner()]),

  Analytics: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      eventType: a.enum(['file_upload', 'file_download', 'file_share', 'folder_create', 'storage_usage']),
      eventData: a.json(),
      timestamp: a.datetime().required(),
      user: a.belongsTo('User', ['userId']),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
```

### 6. Configure Main Backend

Create `amplify/backend.ts`:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

defineBackend({
  auth,
  data,
  storage,
});
```

### 7. Update Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "amplify:deploy": "npx @aws-amplify/backend-cli sandbox",
    "amplify:delete": "npx @aws-amplify/backend-cli sandbox delete",
    "amplify:generate": "npx @aws-amplify/backend-cli generate outputs --app-id YOUR_APP_ID --branch main"
  }
}
```

## 🚀 Deployment

### Deploy the Backend

```bash
npm run amplify:deploy
```

This will:
- Create AWS Cognito User Pool
- Set up S3 bucket with proper permissions
- Create DynamoDB tables
- Set up AppSync GraphQL API
- Generate `amplify_outputs.json` configuration file

## 🔧 Frontend Integration

### 1. Install Frontend Dependencies

```bash
npm install aws-amplify
```

### 2. Create Amplify Configuration

Create `src/lib/amplify.ts`:

```typescript
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

export default Amplify;
```

### 3. Create Authentication Service

Create `src/lib/authService.ts` (see next section for full implementation)

### 4. Create Authentication Hook

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { authService, AuthUser } from '../lib/authService';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const checkAuthState = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
};
```

### 5. Create Authentication Guard

Create `src/components/auth/AuthGuard.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
```

### 6. Update Main App

Update `src/main.tsx`:

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/amplify";

createRoot(document.getElementById("root")!).render(<App />);
```

### 7. Update App Routes

Update `src/App.tsx` to use AuthGuard:

```typescript
import { AuthGuard } from "./components/auth/AuthGuard";

// Wrap protected routes with AuthGuard
<Route path="/dashboard" element={<AuthGuard><DashboardLayout><Dashboard /></DashboardLayout></AuthGuard>} />
```

## 🔐 Authentication Features

### Automatic Session Management

The system automatically handles:
- **Session conflicts** during login
- **Session cleanup** after registration
- **Session cleanup** after password reset
- **Session cleanup** after email verification

### User Registration Flow

1. User fills registration form
2. System creates Cognito user
3. Email verification code sent
4. User verifies email
5. Ready to login

### Password Reset Flow

1. User requests password reset
2. System sends reset code to email
3. User enters code and new password
4. Password updated successfully
5. Ready to login with new password

## 📁 File Storage Integration

### S3 Bucket Structure

```
CloudVaultStorageBucket/
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

### Access Permissions

- **user-files/{entity_id}/***: Authenticated users can read/write/delete their own files
- **shared-files/***: Authenticated users can read/write/delete shared files
- **public-files/***: Authenticated users can read/write/delete, guests can read

## 🗄️ Database Schema

### Models

- **User**: User profile and storage information
- **Folder**: Hierarchical folder structure
- **File**: File metadata and S3 references
- **ShareLink**: File sharing with expiration and limits
- **Analytics**: User activity tracking

### Relationships

- User → Folders (one-to-many)
- User → Files (one-to-many)
- Folder → Files (one-to-many)
- Folder → Subfolders (self-referencing)
- File → ShareLinks (one-to-many)

## 🚀 Production Deployment

### 1. Deploy to Production

```bash
npx @aws-amplify/backend-cli deploy --branch main
```

### 2. Generate Production Outputs

```bash
npm run amplify:generate
```

### 3. Environment Variables

Set up environment variables for different stages:

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

## 🔧 Troubleshooting

### Common Issues

1. **"Already signed in user" error**
   - The system automatically handles this
   - No manual intervention needed

2. **Session conflicts**
   - Automatic session cleanup implemented
   - Users can switch between accounts seamlessly

3. **Email verification not working**
   - Check Cognito User Pool email settings
   - Verify email templates

4. **S3 upload permissions**
   - Ensure IAM roles are properly configured
   - Check bucket policies

### Debug Mode

Enable debug logging:

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure(outputs, {
  ssr: true
});

// Enable debug logging
Amplify.Logger.LOG_LEVEL = 'DEBUG';
```

## 📚 Additional Resources

- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/react/build-a-backend/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [S3 Storage](https://docs.aws.amazon.com/s3/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [AppSync GraphQL](https://docs.aws.amazon.com/appsync/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy coding!** 🚀 Your CloudVault app now has production-ready AWS Amplify integration!
