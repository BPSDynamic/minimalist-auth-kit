# 🤝 CloudVault Contributing Guide

## **Welcome Contributors!**

Thank you for your interest in contributing to CloudVault! This guide will help you get started with contributing to our enterprise file management system.

## **📋 Table of Contents**

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Workflow](#contributing-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community Guidelines](#community-guidelines)

## **📜 Code of Conduct**

### **Our Pledge**

We are committed to making participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### **Our Standards**

**Examples of behavior that contributes to creating a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## **🚀 Getting Started**

### **Prerequisites**

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Git**: Latest version
- **AWS CLI**: 2.x or later (for backend development)
- **Code Editor**: VS Code (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - AWS Toolkit

### **Fork and Clone**

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
```bash
git clone https://github.com/YOUR_USERNAME/cloudvault.git
cd cloudvault
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/cloudvault.git
```

## **🛠️ Development Setup**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your AWS credentials and settings
```

### **3. Start Development Server**
```bash
npm run dev
```

### **4. Verify Setup**
- Open http://localhost:8080
- Ensure the application loads without errors
- Check browser console for any warnings

## **🔄 Contributing Workflow**

### **1. Create a Feature Branch**
```bash
# Update your fork
git checkout main
git pull upstream main

# Create and checkout feature branch
git checkout -b feature/your-feature-name
```

### **2. Make Your Changes**
- Write clean, maintainable code
- Follow our coding standards
- Add tests for new functionality
- Update documentation as needed

### **3. Commit Your Changes**
```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add new file sharing feature

- Implement secure file sharing with expiration
- Add email notifications for shared files
- Update UI components for sharing workflow
- Add comprehensive tests

Fixes #123"
```

### **4. Push and Create Pull Request**
```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## **📝 Coding Standards**

### **TypeScript Guidelines**

#### **1. Type Safety**
```typescript
// ✅ Good - Explicit types
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

const createUser = (userData: UserData): Promise<User> => {
  // Implementation
};

// ❌ Bad - Any types
const createUser = (userData: any): any => {
  // Implementation
};
```

#### **2. Interface Naming**
```typescript
// ✅ Good - Descriptive interface names
interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  compressionEnabled: boolean;
}

// ❌ Bad - Generic names
interface Options {
  max: number;
  types: string[];
  compress: boolean;
}
```

### **React Component Guidelines**

#### **1. Component Structure**
```typescript
// ✅ Good - Functional component with proper typing
interface FileManagerProps {
  files: FileMetadata[];
  onUpload: (files: File[]) => void;
  onDelete: (fileId: string) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ 
  files, 
  onUpload, 
  onDelete 
}) => {
  // Component logic
  return (
    <div className="file-manager">
      {/* Component JSX */}
    </div>
  );
};
```

#### **2. Hooks Usage**
```typescript
// ✅ Good - Custom hooks for complex logic
const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      // Upload logic
    } finally {
      setIsUploading(false);
    }
  }, []);
  
  return { isUploading, progress, uploadFile };
};
```

### **CSS/Styling Guidelines**

#### **1. Tailwind CSS Classes**
```typescript
// ✅ Good - Semantic class organization
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <span className="text-sm font-medium text-gray-900">File Name</span>
  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
    Download
  </button>
</div>

// ❌ Bad - Unclear class usage
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <span className="text-sm font-medium text-gray-900">File Name</span>
</div>
```

#### **2. Component Styling**
```typescript
// ✅ Good - Use CSS variables for theming
const Button = styled.button`
  background-color: var(--primary-color);
  color: var(--primary-text);
  border-radius: var(--border-radius);
`;

// ✅ Good - Conditional classes
const buttonClasses = cn(
  "px-4 py-2 rounded-md font-medium transition-colors",
  {
    "bg-blue-600 text-white hover:bg-blue-700": variant === "primary",
    "bg-gray-200 text-gray-900 hover:bg-gray-300": variant === "secondary",
  }
);
```

## **🧪 Testing Guidelines**

### **1. Unit Tests**
```typescript
// ✅ Good - Comprehensive unit test
describe('FileUploadService', () => {
  it('should upload file successfully', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockProgress = jest.fn();
    
    const result = await fileUploadService.upload(mockFile, {
      onProgress: mockProgress
    });
    
    expect(result.success).toBe(true);
    expect(result.fileId).toBeDefined();
    expect(mockProgress).toHaveBeenCalled();
  });
  
  it('should handle upload errors gracefully', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    // Mock network error
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    
    const result = await fileUploadService.upload(mockFile);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
```

### **2. Integration Tests**
```typescript
// ✅ Good - Integration test
describe('File Management Flow', () => {
  it('should complete full file lifecycle', async () => {
    // Upload file
    const uploadResult = await uploadFile(testFile);
    expect(uploadResult.success).toBe(true);
    
    // List files
    const files = await listFiles();
    expect(files).toContainEqual(
      expect.objectContaining({ id: uploadResult.fileId })
    );
    
    // Download file
    const downloadResult = await downloadFile(uploadResult.fileId);
    expect(downloadResult.success).toBe(true);
    
    // Delete file
    const deleteResult = await deleteFile(uploadResult.fileId);
    expect(deleteResult.success).toBe(true);
  });
});
```

### **3. Component Tests**
```typescript
// ✅ Good - React component test
describe('FileManager Component', () => {
  it('should render files list correctly', () => {
    const mockFiles = [
      { id: '1', name: 'test1.txt', size: 1024 },
      { id: '2', name: 'test2.txt', size: 2048 }
    ];
    
    render(<FileManager files={mockFiles} onUpload={jest.fn()} />);
    
    expect(screen.getByText('test1.txt')).toBeInTheDocument();
    expect(screen.getByText('test2.txt')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });
  
  it('should handle file upload', async () => {
    const mockOnUpload = jest.fn();
    const testFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    render(<FileManager files={[]} onUpload={mockOnUpload} />);
    
    const uploadInput = screen.getByLabelText('Upload files');
    await user.upload(uploadInput, testFile);
    
    expect(mockOnUpload).toHaveBeenCalledWith([testFile]);
  });
});
```

## **📋 Pull Request Process**

### **1. Pre-submission Checklist**
- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated (if applicable)
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Manual testing completed

### **2. Pull Request Template**
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### **3. Review Process**
1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing by reviewer if applicable
4. **Documentation**: Ensure documentation is updated
5. **Approval**: Maintainer approval required for merge

## **🐛 Issue Reporting**

### **1. Bug Reports**
Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

### **2. Feature Requests**
Use the feature request template:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## **🏗️ Development Guidelines**

### **1. Architecture Principles**
- **Separation of Concerns**: Keep components, services, and utilities separate
- **Single Responsibility**: Each function/component should have one clear purpose
- **DRY (Don't Repeat Yourself)**: Reuse code through proper abstraction
- **SOLID Principles**: Follow object-oriented design principles

### **2. Performance Guidelines**
- **Code Splitting**: Use dynamic imports for large components
- **Memoization**: Use React.memo, useMemo, and useCallback appropriately
- **Bundle Size**: Keep bundle size under 1MB
- **Loading States**: Always provide loading indicators for async operations

### **3. Security Guidelines**
- **Input Validation**: Always validate user inputs
- **Authentication**: Use proper authentication patterns
- **Authorization**: Implement proper access controls
- **Data Sanitization**: Sanitize data before processing

## **📚 Learning Resources**

### **Technology Stack**
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### **Best Practices**
- [React Best Practices](https://reactjs.org/docs/thinking-in-react.html)
- [TypeScript Best Practices](https://typescript-eslint.io/docs/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

## **🎯 Contribution Areas**

We welcome contributions in the following areas:

### **High Priority**
- 🐛 Bug fixes
- 🔒 Security improvements
- 📱 Mobile responsiveness
- ♿ Accessibility improvements
- 🚀 Performance optimizations

### **Medium Priority**
- ✨ New features
- 📚 Documentation improvements
- 🧪 Test coverage improvements
- 🎨 UI/UX enhancements

### **Low Priority**
- 🔧 Code refactoring
- 📦 Dependency updates
- 🏗️ Build process improvements

## **🏆 Recognition**

### **Contributor Levels**
- **First-time Contributor**: Made first successful PR
- **Regular Contributor**: 5+ merged PRs
- **Core Contributor**: 20+ merged PRs + significant features
- **Maintainer**: Trusted with repository access

### **Recognition Methods**
- Contributors list in README
- Special badges for significant contributions
- Mention in release notes
- Invitation to maintainer team (for core contributors)

## **💬 Community Guidelines**

### **Communication Channels**
- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General discussions, questions
- **Pull Request Comments**: Code review discussions

### **Response Times**
- **Issues**: We aim to respond within 48 hours
- **Pull Requests**: Initial review within 72 hours
- **Security Issues**: Response within 24 hours

### **Getting Help**
- Check existing issues and documentation first
- Use GitHub Discussions for questions
- Tag maintainers if urgent
- Be patient and respectful

## **📄 License**

By contributing to CloudVault, you agree that your contributions will be licensed under the same license as the project (MIT License).

## **🙏 Thank You**

Thank you for contributing to CloudVault! Your efforts help make this project better for everyone. We appreciate your time and expertise.

---

**Happy Coding! 🚀**

For questions about contributing, please open a GitHub Discussion or contact the maintainers.
