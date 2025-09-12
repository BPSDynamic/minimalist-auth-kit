# Quick Setup Guide - Minimalist Auth Kit

## 🚀 5-Minute Setup

Get your secure file management and sharing platform running in minutes!

### Prerequisites
- Node.js 18+ and npm
- AWS Account
- Git

### Step 1: Clone and Install
```bash
# Clone the repository
git clone https://github.com/BPSDynamic/minimalist-auth-kit.git
cd minimalist-auth-kit

# Install dependencies
npm install
```

### Step 2: Deploy AWS Backend
```bash
# Install Amplify CLI globally
npm install -g @aws-amplify/cli

# Deploy the complete backend (Auth + S3 + AppSync)
npx ampx sandbox deploy
```

**What this creates:**
- ✅ AWS Cognito User Pool for authentication
- ✅ S3 Bucket for file storage
- ✅ AppSync GraphQL API
- ✅ IAM roles and policies
- ✅ `amplify_outputs.json` configuration file

### Step 3: Start Development Server
```bash
npm run dev
```

Open `http://localhost:8080` in your browser.

### Step 4: Test the Application
1. **Register** a new account
2. **Verify** your email (check spam folder)
3. **Login** to the dashboard
4. **Upload** files and create folders
5. **Share** files with others

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

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint

# AWS Amplify
npm run amplify:deploy   # Deploy backend to AWS
npm run amplify:delete   # Delete backend from AWS
```

## 🌐 Deployment Options

### Option 1: AWS Amplify Hosting (Recommended)
```bash
# Initialize hosting
npx ampx generate hosting

# Deploy everything
npx ampx sandbox deploy
```

### Option 2: AWS Marketplace SaaS
Perfect for selling as a SaaS product:
- Source code stays private
- Customers deploy to their own AWS accounts
- One-click deployment via AWS Marketplace
- Automatic billing through AWS

## 📊 Current Status

### ✅ Production Ready Features
- [x] Complete user authentication system
- [x] File upload and download with S3
- [x] Folder management and organization
- [x] File sharing with recipients
- [x] Metadata management system
- [x] Responsive UI with modern design
- [x] Real-time session management
- [x] Automatic sender information in sharing
- [x] AWS Amplify Gen 2 backend deployed

### 🚧 Future Enhancements
- [ ] Advanced file search and filtering
- [ ] File versioning system
- [ ] Bulk operations
- [ ] Advanced sharing permissions
- [ ] Audit logging and analytics

## 🔧 Configuration

### Environment Setup
The application automatically configures itself using the `amplify_outputs.json` file. No additional environment variables needed!

### AWS Region
Currently deployed in: **`eu-west-1`** (Europe - Ireland)
- Cognito User Pool: `eu-west-1_qmydSb2rp`
- S3 Bucket: `amplify-minimalistauthkit-cloudvaultstoragebuckete-imgg9agmjq4j`
- AppSync API: `mtdnbhvqibephi2skrgsgsjipe.appsync-api.eu-west-1.amazonaws.com`

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

### Getting Help
- Check the browser console for detailed error messages
- Verify AWS credentials and permissions
- Ensure all dependencies are installed correctly
- Check the full tutorial for detailed explanations

## 📚 Full Documentation

For detailed explanations and advanced features:
- **`AMPLIFY_INTEGRATION_TUTORIAL.md`** - Complete step-by-step backend setup
- **`AUTH_SERVICE_IMPLEMENTATION.md`** - Detailed authentication service code
- **`README.md`** - Complete project overview and features

## 🎯 Next Steps

After successful setup:

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

## 🚀 Business Ready

This application is designed for **AWS Marketplace SaaS** deployment:

- **Private Source Code**: Your code remains in your private repository
- **Customer Deployment**: Each customer gets their own AWS environment
- **Automatic Billing**: AWS handles billing through Marketplace
- **Scalable Architecture**: Supports unlimited customers
- **Enterprise Security**: Production-ready security and compliance

---

**Ready to launch your secure file management platform! 🚀**