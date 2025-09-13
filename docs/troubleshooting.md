# 🔧 CloudVault Troubleshooting Guide

## **Common Issues and Solutions**

This guide helps you resolve common issues when developing, deploying, or using CloudVault.

## **📋 Table of Contents**

- [Development Issues](#development-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Authentication Issues](#authentication-issues)
- [File Upload/Download Issues](#file-uploaddownload-issues)
- [AWS Services Issues](#aws-services-issues)
- [Performance Issues](#performance-issues)
- [UI/UX Issues](#uiux-issues)
- [Database Issues](#database-issues)

## **🛠️ Development Issues**

### **Issue: Import Path Errors**
```
Error: Failed to resolve import "../amplify_outputs.json" from "src/lib/lambdaService.ts"
```

**Solution:**
```typescript
// Check the correct path to amplify_outputs.json
// From src/lib/, it should be:
import amplify_outputs from '../../amplify_outputs.json';

// Verify file exists:
ls -la amplify_outputs.json
```

**Prevention:**
- Use absolute imports with path mapping
- Verify file locations before importing
- Use TypeScript path resolution

### **Issue: Module Resolution Errors**
```
Error: Cannot find module '@/components/ui/button'
```

**Solution:**
```bash
# Check tsconfig.json path mapping
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# Verify file exists
ls -la src/components/ui/button.tsx
```

### **Issue: TypeScript Compilation Errors**
```
Error: Property 'xyz' does not exist on type 'ABC'
```

**Solution:**
```typescript
// Add proper type definitions
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  xyz?: string; // Add missing property
}

// Or use type assertion (use sparingly)
const userData = response.data as UserData;
```

### **Issue: React Hook Dependency Warnings**
```
Warning: React Hook useEffect has a missing dependency
```

**Solution:**
```typescript
// Add missing dependencies
useEffect(() => {
  fetchData();
}, [fetchData]); // Add fetchData to dependencies

// Or wrap function in useCallback
const fetchData = useCallback(async () => {
  // Function logic
}, [dependency1, dependency2]);
```

## **🏗️ Build and Deployment Issues**

### **Issue: Build Fails with Memory Error**
```
Error: JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or modify package.json
{
  "scripts": {
    "build": "node --max-old-space-size=4096 node_modules/.bin/vite build"
  }
}
```

### **Issue: Large Bundle Size Warning**
```
Warning: Some chunks are larger than 500 kB after minification
```

**Solution:**
```typescript
// Implement code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// Configure manual chunks in vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          aws: ['aws-amplify'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
});
```

### **Issue: Environment Variables Not Working**
```
Error: process.env.VITE_APP_API_URL is undefined
```

**Solution:**
```bash
# Ensure variables start with VITE_
VITE_APP_API_URL=https://api.example.com
VITE_APP_REGION=us-east-1

# Check .env file location (should be in project root)
ls -la .env*

# Restart development server after changes
npm run dev
```

### **Issue: AWS Amplify Deployment Fails**
```
Error: npm error could not determine executable to run
```

**Solution:**
```bash
# Install Amplify CLI globally
npm install -g @aws-amplify/cli-core

# Or use npx with full path
npx @aws-amplify/backend-cli@latest sandbox

# Check AWS credentials
aws sts get-caller-identity

# Verify amplify/backend.ts exists
ls -la amplify/backend.ts
```

## **🔐 Authentication Issues**

### **Issue: User Not Authenticated After Login**
```
Error: User is not authenticated
```

**Solution:**
```typescript
// Check authentication state properly
const checkAuthState = async () => {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    console.log('User authenticated:', user, attributes);
  } catch (error) {
    console.log('User not authenticated:', error);
    // Redirect to login
  }
};

// Ensure Hub listener is set up
Hub.listen('auth', (data) => {
  console.log('Auth event:', data);
  switch (data.payload.event) {
    case 'signIn':
      console.log('User signed in');
      break;
    case 'signOut':
      console.log('User signed out');
      break;
  }
});
```

### **Issue: JWT Token Expired**
```
Error: Access Token has expired
```

**Solution:**
```typescript
// Implement automatic token refresh
const refreshAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    if (session.tokens?.accessToken) {
      console.log('Token refreshed successfully');
      return session.tokens.accessToken;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to login
    window.location.href = '/login';
  }
};

// Add token refresh interceptor
const apiCall = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, options);
    if (response.status === 401) {
      await refreshAuthToken();
      // Retry the request
      return fetch(url, options);
    }
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

### **Issue: MFA Setup Problems**
```
Error: Invalid verification code
```

**Solution:**
```typescript
// Ensure proper MFA setup flow
const setupMFA = async () => {
  try {
    // Setup TOTP
    const totpSetup = await setUpTOTP();
    console.log('TOTP setup:', totpSetup);
    
    // Get QR code for authenticator app
    const qrCodeUrl = totpSetup.getSetupUri('CloudVault', user.email);
    
    // Verify TOTP code
    const verificationCode = prompt('Enter verification code:');
    await verifyTOTPSetup({ code: verificationCode });
    
    console.log('MFA setup completed');
  } catch (error) {
    console.error('MFA setup failed:', error);
  }
};
```

## **📁 File Upload/Download Issues**

### **Issue: File Upload Fails**
```
Error: Upload failed with status 403
```

**Solution:**
```typescript
// Check S3 permissions and bucket policy
const uploadFile = async (file: File) => {
  try {
    // Ensure user is authenticated
    const user = await getCurrentUser();
    
    // Check file size limits
    if (file.size > 100 * 1024 * 1024) { // 100MB
      throw new Error('File too large');
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }
    
    const result = await uploadData({
      key: `${user.userId}/${file.name}`,
      data: file,
      options: {
        accessLevel: 'private',
        onProgress: (progress) => {
          console.log('Upload progress:', progress);
        }
      }
    });
    
    console.log('Upload successful:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### **Issue: Download URL Not Working**
```
Error: SignatureDoesNotMatch
```

**Solution:**
```typescript
// Generate proper signed URL
const getDownloadUrl = async (fileKey: string) => {
  try {
    const url = await getUrl({
      key: fileKey,
      options: {
        accessLevel: 'private',
        expiresIn: 3600 // 1 hour
      }
    });
    
    console.log('Download URL:', url.url.toString());
    return url.url.toString();
  } catch (error) {
    console.error('Failed to get download URL:', error);
    throw error;
  }
};
```

### **Issue: File Metadata Missing**
```
Error: Cannot read properties of undefined
```

**Solution:**
```typescript
// Ensure metadata is properly stored and retrieved
const uploadFileWithMetadata = async (file: File) => {
  const metadata = {
    originalName: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    uploadedBy: user.userId
  };
  
  const result = await uploadData({
    key: `${user.userId}/${file.name}`,
    data: file,
    options: {
      accessLevel: 'private',
      metadata: metadata
    }
  });
  
  // Store additional metadata in DynamoDB
  await dynamoService.createFileRecord({
    fileId: result.key,
    ...metadata
  });
};
```

## **☁️ AWS Services Issues**

### **Issue: DynamoDB Access Denied**
```
Error: User: arn:aws:sts::xxx:assumed-role/xxx is not authorized to perform: dynamodb:GetItem
```

**Solution:**
```typescript
// Check IAM permissions in amplify/backend.ts
export const backend = defineBackend({
  auth,
  data,
  storage
});

// Ensure proper resource access in data/resource.ts
const schema = a.schema({
  File: a
    .model({
      id: a.id(),
      name: a.string(),
      size: a.integer(),
      uploadedBy: a.string()
    })
    .authorization([
      a.allow.owner(),
      a.allow.authenticated().to(['read'])
    ])
});
```

### **Issue: S3 CORS Errors**
```
Error: Access to fetch at 'https://bucket.s3.amazonaws.com' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```typescript
// Update S3 CORS configuration in amplify/storage/resource.ts
export const storage = defineStorage({
  name: 'cloudvault-storage',
  access: (allow) => ({
    'public/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read'])
    ],
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write'])
    ]
  })
});
```

### **Issue: Lambda Function Timeout**
```
Error: Task timed out after 30.00 seconds
```

**Solution:**
```typescript
// Increase timeout in function resource
export const fileProcessor = defineFunction({
  name: 'fileProcessor',
  entry: './handler.ts',
  timeout: Duration.minutes(5), // Increase timeout
  memoryMB: 1024, // Increase memory if needed
  environment: {
    BUCKET_NAME: storage.bucketName
  }
});
```

## **⚡ Performance Issues**

### **Issue: Slow Page Load Times**
```
Performance: First Contentful Paint > 3s
```

**Solution:**
```typescript
// Implement code splitting and lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FileManager = lazy(() => import('./components/FileManager'));

// Add loading fallback
<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>

// Optimize images
<img 
  src={imageUrl} 
  alt="Description"
  loading="lazy"
  width="300"
  height="200"
/>

// Use React.memo for expensive components
export const FileList = React.memo(({ files }) => {
  return (
    <div>
      {files.map(file => <FileItem key={file.id} file={file} />)}
    </div>
  );
});
```

### **Issue: Memory Leaks**
```
Warning: Can't perform a React state update on an unmounted component
```

**Solution:**
```typescript
// Clean up subscriptions and timers
useEffect(() => {
  const subscription = someService.subscribe(callback);
  const timer = setInterval(updateData, 1000);
  
  return () => {
    subscription.unsubscribe();
    clearInterval(timer);
  };
}, []);

// Use AbortController for fetch requests
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    }
  };
  
  fetchData();
  
  return () => {
    controller.abort();
  };
}, []);
```

## **🎨 UI/UX Issues**

### **Issue: Responsive Design Problems**
```
Issue: Layout breaks on mobile devices
```

**Solution:**
```css
/* Use responsive Tailwind classes */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

/* Test on different screen sizes */
<div className="hidden md:block">Desktop only content</div>
<div className="block md:hidden">Mobile only content</div>

/* Use responsive text sizes */
<h1 className="text-2xl md:text-4xl lg:text-6xl">Responsive heading</h1>
```

### **Issue: Dark Mode Not Working**
```
Issue: Theme toggle doesn't change colors
```

**Solution:**
```typescript
// Ensure proper theme provider setup
import { ThemeProvider } from 'next-themes';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background text-foreground">
        {/* App content */}
      </div>
    </ThemeProvider>
  );
}

// Use proper CSS variables
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

### **Issue: Accessibility Problems**
```
Issue: Screen reader can't navigate properly
```

**Solution:**
```typescript
// Add proper ARIA labels and roles
<button 
  aria-label="Upload file"
  aria-describedby="upload-help"
  onClick={handleUpload}
>
  <UploadIcon />
</button>
<div id="upload-help" className="sr-only">
  Click to select files for upload
</div>

// Ensure proper heading hierarchy
<h1>Dashboard</h1>
  <h2>Files</h2>
    <h3>Recent Files</h3>
  <h2>Settings</h2>

// Add focus management
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen) {
    dialogRef.current?.focus();
  }
}, [isOpen]);
```

## **🗄️ Database Issues**

### **Issue: DynamoDB Query Errors**
```
Error: ValidationException: Invalid KeyConditionExpression
```

**Solution:**
```typescript
// Use proper query syntax
const queryFiles = async (userEmail: string) => {
  const params = {
    TableName: 'CloudVault-Files',
    KeyConditionExpression: 'userEmail = :userEmail',
    ExpressionAttributeValues: {
      ':userEmail': userEmail
    }
  };
  
  try {
    const result = await dynamodb.query(params).promise();
    return result.Items;
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
};
```

### **Issue: Data Consistency Problems**
```
Issue: Stale data displayed in UI
```

**Solution:**
```typescript
// Implement proper cache invalidation
const useFiles = (userEmail: string) => {
  return useQuery({
    queryKey: ['files', userEmail],
    queryFn: () => fetchFiles(userEmail),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Invalidate cache after mutations
const uploadFileMutation = useMutation({
  mutationFn: uploadFile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['files'] });
  }
});
```

## **🔍 Debugging Tools**

### **Browser DevTools**
- **Console**: Check for JavaScript errors
- **Network**: Monitor API calls and responses
- **Application**: Inspect localStorage, sessionStorage, cookies
- **Performance**: Profile performance issues
- **Lighthouse**: Audit performance, accessibility, SEO

### **React DevTools**
- **Components**: Inspect component props and state
- **Profiler**: Profile component render performance
- **Redux DevTools**: Debug state management (if using Redux)

### **AWS Tools**
- **CloudWatch Logs**: Monitor Lambda function logs
- **X-Ray**: Trace distributed requests
- **AWS CLI**: Debug AWS service configurations

### **Logging Best Practices**
```typescript
// Use structured logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error);
  }
};

// Log important events
logger.info('File upload started', { fileName, fileSize });
logger.error('File upload failed', error);
```

## **📞 Getting Help**

If you can't resolve an issue using this guide:

1. **Check GitHub Issues**: Search for similar problems
2. **Review Documentation**: Check official docs for AWS services
3. **Community Support**: Ask in GitHub Discussions
4. **Stack Overflow**: Search for related questions
5. **AWS Support**: For AWS-specific issues

## **🔄 Regular Maintenance**

### **Weekly Tasks**
- Update dependencies
- Check for security vulnerabilities
- Review error logs
- Monitor performance metrics

### **Monthly Tasks**
- Update AWS service configurations
- Review and optimize database queries
- Check bundle size and performance
- Update documentation

### **Quarterly Tasks**
- Security audit
- Performance review
- Architecture review
- Dependency cleanup

---

**Remember**: Most issues have been encountered by someone else before. Don't hesitate to search for solutions and ask for help when needed!
