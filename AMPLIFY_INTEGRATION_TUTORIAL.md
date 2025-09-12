# Minimalist Auth Kit - AWS Amplify Gen 2 Integration Tutorial

A complete guide to integrating AWS Amplify Gen 2 with a React application for secure file management, authentication, and sharing.

## 🚀 Overview

This tutorial shows how to integrate AWS Amplify Gen 2 with a React application, including:
- **Authentication** with AWS Cognito
- **File Storage** with AWS S3
- **File Sharing** with secure links and metadata
- **Folder Management** with S3-based organization
- **Real-time features** and session management

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS CLI configured
- AWS Account with appropriate permissions
- Git

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
      verificationEmailSubject: 'Welcome to Minimalist Auth Kit! Verify your email!',
      verificationEmailBody: (code) => `
        <p>Hello,</p>
        <p>Thank you for registering with Minimalist Auth Kit. Please use the following code to verify your email address:</p>
        <h3>${code}</h3>
        <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The Minimalist Auth Kit Team</p>
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
    'metadata/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
```

### 5. Configure Data (AppSync + DynamoDB)

Create `amplify/data/resource.ts`:

```typescript
import { defineData } from '@aws-amplify/backend';
import { auth, storage } from './auth/resource';
import { type } from 'aws-amplify/backend';

export const data = defineData({
  schema: {
    User: type
      .model({
        id: type.id().required(),
        email: type.string().required(),
        firstName: type.string().required(),
        lastName: type.string().required(),
        files: type.hasMany('File', 'userId'),
        sharedFiles: type.hasMany('SharedFile', 'sharedBy'),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.authenticated().to(['read', 'create', 'update']),
      ]),

    File: type
      .model({
        id: type.id().required(),
        name: type.string().required(),
        type: type.string().required(),
        size: type.integer().required(),
        s3Key: type.string().required(),
        folderId: type.string(),
        tags: type.string().array(),
        confidentiality: type.string(),
        importance: type.string(),
        allowSharing: type.boolean(),
        userId: type.id().required(),
        user: type.belongsTo('User', 'userId'),
        sharedFiles: type.hasMany('SharedFile', 'fileId'),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.authenticated().to(['read', 'create', 'update', 'delete']),
      ]),

    SharedFile: type
      .model({
        id: type.id().required(),
        fileId: type.id().required(),
        sharedBy: type.id().required(),
        recipients: type.string().array(),
        message: type.string(),
        expirationDays: type.integer(),
        shareLink: type.string(),
        isActive: type.boolean(),
        file: type.belongsTo('File', 'fileId'),
        sharedByUser: type.belongsTo('User', 'sharedBy'),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.authenticated().to(['read', 'create', 'update', 'delete']),
      ]),
  },
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
```

### 6. Configure Main Backend

Create `amplify/backend.ts`:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { data } from './data/resource';

export const backend = defineBackend({
  auth,
  storage,
  data,
});
```

## 🔧 Frontend Integration

### 1. Configure Amplify

Create `src/lib/amplify.ts`:

```typescript
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

export default Amplify;
```

### 2. Create Authentication Service

Create `src/lib/authService.ts`:

```typescript
import { signUp, signIn, signOut, confirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
}

class AuthService {
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          this.getCurrentUser().then(user => {
            this.notifyAuthStateListeners(user);
          });
          break;
        case 'signedOut':
          this.notifyAuthStateListeners(null);
          break;
        case 'tokenRefresh':
          this.getCurrentUser().then(user => {
            this.notifyAuthStateListeners(user);
          });
          break;
      }
    });
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
    };
  }

  private notifyAuthStateListeners(user: AuthUser | null) {
    this.authStateListeners.forEach(callback => callback(user));
  }

  async signUp(data: { email: string; password: string; firstName: string; lastName: string }) {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
          },
        },
      });

      return {
        success: true,
        isSignUpComplete,
        userId,
        nextStep,
        message: 'Account created successfully! Please check your email for verification code.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create account',
      };
    }
  }

  async confirmSignUp(data: { email: string; code: string }) {
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });

      return {
        success: true,
        isSignUpComplete,
        message: 'Email verified successfully! You can now sign in.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify email',
      };
    }
  }

  async signIn(data: { email: string; password: string }) {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: data.email,
        password: data.password,
      });

      if (isSignedIn) {
        const user = await this.getCurrentUser();
        this.notifyAuthStateListeners(user);
        return {
          success: true,
          user,
          message: 'Signed in successfully!',
        };
      }

      return {
        success: false,
        error: 'Sign in failed',
      };
    } catch (error: any) {
      if (error.message && error.message.includes('already a signed in user')) {
        try {
          await signOut();
          const { isSignedIn } = await signIn({
            username: data.email,
            password: data.password,
          });

          if (isSignedIn) {
            const user = await this.getCurrentUser();
            this.notifyAuthStateListeners(user);
            return {
              success: true,
              user,
              message: 'Signed in successfully!',
            };
          }
        } catch (retryError: any) {
          return {
            success: false,
            error: retryError.message || 'Failed to sign in after retry',
          };
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to sign in',
      };
    }
  }

  async signOut() {
    try {
      await signOut();
      this.notifyAuthStateListeners(null);
      return {
        success: true,
        message: 'Signed out successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sign out',
      };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      return {
        id: currentUser.userId,
        email: attributes.email || '',
        firstName: attributes.given_name || '',
        lastName: attributes.family_name || '',
        isEmailVerified: attributes.email_verified || false,
      };
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
```

### 3. Create S3 Service

Create `src/lib/s3Service.ts`:

```typescript
import { uploadData, downloadData, remove, list, getUrl } from 'aws-amplify/storage';
import { authService } from './authService';

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  s3Key: string;
  folderId?: string;
  tags?: string[];
  confidentiality?: 'public' | 'internal' | 'confidential' | 'restricted';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  allowSharing?: boolean;
  shareRecipients?: string[];
  shareMessage?: string;
  shareExpirationDays?: number;
  shareLink?: string;
  shareSender?: {
    name: string;
    surname: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

class S3Service {
  private getCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  };

  private getIdentityId = async (): Promise<string> => {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      return session.identityId || '';
    } catch (error) {
      throw new Error('Failed to get identity ID');
    }
  };

  async uploadFile(file: File, options: any = {}) {
    try {
      const user = await this.getCurrentUser();
      const identityId = await this.getIdentityId();
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = options.folderId 
        ? `${options.folderId}/${timestamp}_${sanitizedFileName}`
        : `${timestamp}_${sanitizedFileName}`;

      const uploadResult = await uploadData({
        key: s3Key,
        data: file,
        options: {
          accessLevel: 'guest',
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (options.onProgress) {
              options.onProgress({
                loaded: transferredBytes,
                total: totalBytes,
                percentage: Math.round((transferredBytes / totalBytes) * 100),
              });
            }
          },
        },
      }).result;

      const fileMetadata: FileMetadata = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        s3Key: uploadResult.key,
        folderId: options.folderId,
        tags: options.tags || [],
        confidentiality: options.confidentiality || 'internal',
        importance: options.importance || 'medium',
        allowSharing: options.allowSharing ?? true,
        shareRecipients: options.shareRecipients,
        shareMessage: options.shareMessage,
        shareExpirationDays: options.shareExpirationDays,
        shareLink: options.shareLink,
        shareSender: options.shareSender,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        fileMetadata,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  }

  async createFolder(folderName: string, allowedFileTypes: string[] = ['all']) {
    try {
      const user = await this.getCurrentUser();
      const sanitizedName = folderName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const folderMetadata = {
        id: uniqueId,
        name: sanitizedName,
        displayName: folderName,
        allowedFileTypes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create folder placeholder
      await uploadData({
        key: `${sanitizedName}/.folder_placeholder`,
        data: new Blob([''], { type: 'text/plain' }),
        options: {
          accessLevel: 'guest',
        },
      }).result;

      // Create folder metadata
      await uploadData({
        key: `.metadata/folders/${sanitizedName}.json`,
        data: JSON.stringify(folderMetadata, null, 2),
        options: {
          accessLevel: 'guest',
        },
      }).result;

      return {
        success: true,
        folderId: sanitizedName,
        metadata: folderMetadata,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create folder',
      };
    }
  }

  async listFolders() {
    try {
      const result = await list({
        prefix: '',
        options: {
          accessLevel: 'guest',
        },
      });

      const folders = [];
      for (const item of result.items) {
        if (item.key.endsWith('.folder_placeholder')) {
          const folderName = item.key.split('/')[0];
          const metadata = await this.getFolderMetadata(folderName);
          if (metadata) {
            folders.push(metadata);
          }
        }
      }

      return {
        success: true,
        folders,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list folders',
      };
    }
  }

  async getFolderMetadata(folderName: string) {
    try {
      const result = await downloadData({
        key: `.metadata/folders/${folderName}.json`,
        options: {
          accessLevel: 'guest',
        },
      }).result;

      const metadataText = await result.body.text();
      return JSON.parse(metadataText);
    } catch (error) {
      return null;
    }
  }
}

export const s3Service = new S3Service();
```

### 4. Create Auth Hook

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { authService, AuthUser } from '../lib/authService';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

### 5. Create Auth Guard

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

## 🚀 Deployment

### 1. Deploy Backend

```bash
npx ampx sandbox deploy
```

This will:
- Create AWS Cognito User Pool
- Create S3 Bucket with proper permissions
- Create AppSync GraphQL API
- Generate `amplify_outputs.json` configuration file

### 2. Deploy Frontend

```bash
# Build for production
npm run build

# Deploy to AWS Amplify Hosting
npx ampx generate hosting
npx ampx sandbox deploy
```

## ✅ What You Get

### 🔐 Complete Authentication System
- User registration with email verification
- Secure login/logout with session management
- Password reset functionality
- Automatic session conflict resolution
- Real-time auth state updates

### 📁 Full File Management
- Drag & drop file uploads with progress tracking
- Folder creation and organization
- File metadata (tags, confidentiality, importance)
- Search and filtering capabilities
- File download and sharing

### 🔗 Advanced File Sharing
- Share files with specific recipients
- Set expiration dates for shared files
- Add custom messages to shares
- Automatic sender information from user profile
- Secure, time-limited download links

### 🎨 Modern UI/UX
- Responsive design for all devices
- Dark/light theme support
- Clean, minimalist interface
- Real-time updates and notifications
- Professional business-ready design

## 🔧 Configuration

### Environment Variables
The application automatically configures itself using the `amplify_outputs.json` file. No additional environment variables needed!

### AWS Region
Currently deployed in: **`eu-west-1`** (Europe - Ireland)

### S3 Bucket Structure
```
bucket/
├── user-files/
│   └── {user_id}/
│       ├── files/
│       └── folders/
├── shared-files/
│   └── {file_id}/
├── metadata/
│   ├── files/
│   └── folders/
└── public/
    └── shared/
```

## 🆘 Troubleshooting

### Common Issues

**1. "Already signed in user" error**
- ✅ **Solution**: System handles automatically with session cleanup

**2. Email verification not received**
- ✅ **Solution**: Check spam folder, resend if needed

**3. S3 upload permissions error**
- ✅ **Solution**: Backend handles permissions automatically

**4. Session conflicts**
- ✅ **Solution**: Automatic cleanup implemented

**5. Files not appearing after upload**
- ✅ **Solution**: Refresh page, check S3 bucket

## 📚 Next Steps

After successful integration:

1. **Test All Features**
   - Register multiple users
   - Upload different file types
   - Create and organize folders
   - Share files between users

2. **Customize for Your Needs**
   - Modify UI themes and colors
   - Add custom file type restrictions
   - Implement additional metadata fields
   - Add custom sharing options

3. **Deploy to Production**
   - Use AWS Amplify Hosting for easy deployment
   - Set up custom domain
   - Configure production environment
   - Set up monitoring and logging

4. **Scale for Business**
   - Prepare for AWS Marketplace SaaS deployment
   - Set up customer onboarding process
   - Implement billing and subscription management
   - Add enterprise features

## 🎯 Business Ready

This application is designed for **AWS Marketplace SaaS** deployment:

- **Private Source Code**: Your code remains in your private repository
- **Customer Deployment**: Each customer gets their own AWS environment
- **Automatic Billing**: AWS handles billing through Marketplace
- **Scalable Architecture**: Supports unlimited customers
- **Enterprise Security**: Production-ready security and compliance

---

**Your secure file management platform is ready! 🚀**