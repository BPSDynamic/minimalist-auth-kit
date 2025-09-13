# 📡 CloudVault API Documentation

## **Overview**

CloudVault provides a comprehensive REST API for file management, user authentication, and analytics. The API is built on AWS API Gateway with Lambda functions and follows RESTful principles.

## **Base URL**

```
Production: https://api.cloudvault.com/v1
Development: https://dev-api.cloudvault.com/v1
```

## **Authentication**

All API requests require authentication using AWS Cognito JWT tokens.

### **Headers**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### **Token Refresh**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## **API Endpoints**

### **Authentication Endpoints**

#### **User Registration**
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "message": "User registered successfully. Please check your email for verification."
}
```

#### **User Login**
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme Corp"
  }
}
```

#### **User Logout**
```http
POST /auth/signout
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

#### **Get Current User**
```http
GET /auth/me
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme Corp",
    "role": "user",
    "permissions": ["read", "write", "share"],
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

### **File Management Endpoints**

#### **Upload File**
```http
POST /files/upload
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

file: <file-data>
folderId: "folder-123"
tags: ["important", "work"]
confidentiality: "internal"
importance: "high"
allowSharing: true
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-123",
    "name": "document.pdf",
    "originalName": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "hash": "sha256:abc123...",
    "folderId": "folder-123",
    "s3Key": "user@example.com/folder-123/file-123/original/document.pdf",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/file-123.jpg",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "tags": ["important", "work"],
    "confidentiality": "internal",
    "importance": "high",
    "allowSharing": true
  }
}
```

#### **List Files**
```http
GET /files?folderId=folder-123&limit=20&offset=0&sortBy=uploadedAt&sortOrder=desc
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `folderId` (optional): Filter by folder ID
- `limit` (optional): Number of files per page (default: 20)
- `offset` (optional): Number of files to skip (default: 0)
- `sortBy` (optional): Sort field (name, size, uploadedAt, modifiedAt)
- `sortOrder` (optional): Sort order (asc, desc)
- `tags` (optional): Filter by tags (comma-separated)
- `mimeType` (optional): Filter by MIME type

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file-123",
      "name": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "tags": ["important", "work"],
      "confidentiality": "internal",
      "importance": "high",
      "allowSharing": true,
      "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/file-123.jpg"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### **Get File Details**
```http
GET /files/{fileId}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-123",
    "name": "document.pdf",
    "originalName": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "hash": "sha256:abc123...",
    "folderId": "folder-123",
    "s3Key": "user@example.com/folder-123/file-123/original/document.pdf",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/file-123.jpg",
    "downloadUrl": "https://s3.amazonaws.com/bucket/downloads/file-123.pdf",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "modifiedAt": "2024-01-15T10:30:00Z",
    "tags": ["important", "work"],
    "confidentiality": "internal",
    "importance": "high",
    "allowSharing": true,
    "exifData": {
      "camera": "Canon EOS R5",
      "lens": "24-70mm f/2.8",
      "iso": 100,
      "aperture": "f/2.8",
      "shutterSpeed": "1/125"
    }
  }
}
```

#### **Download File**
```http
GET /files/{fileId}/download
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://s3.amazonaws.com/bucket/downloads/file-123.pdf?signature=abc123...",
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

#### **Update File**
```http
PUT /files/{fileId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "updated-document.pdf",
  "tags": ["important", "work", "updated"],
  "confidentiality": "confidential",
  "importance": "critical",
  "allowSharing": false
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-123",
    "name": "updated-document.pdf",
    "tags": ["important", "work", "updated"],
    "confidentiality": "confidential",
    "importance": "critical",
    "allowSharing": false,
    "modifiedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### **Delete File**
```http
DELETE /files/{fileId}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### **Folder Management Endpoints**

#### **Create Folder**
```http
POST /folders
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Project Documents",
  "parentId": "folder-123",
  "allowedFileTypes": ["documents", "images"],
  "description": "Folder for project-related documents"
}
```

**Response:**
```json
{
  "success": true,
  "folder": {
    "id": "folder-456",
    "name": "Project Documents",
    "parentId": "folder-123",
    "path": "/folder-123/Project Documents",
    "allowedFileTypes": ["documents", "images"],
    "description": "Folder for project-related documents",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### **List Folders**
```http
GET /folders?parentId=folder-123&limit=20&offset=0
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `parentId` (optional): Filter by parent folder ID
- `limit` (optional): Number of folders per page (default: 20)
- `offset` (optional): Number of folders to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "folders": [
    {
      "id": "folder-456",
      "name": "Project Documents",
      "parentId": "folder-123",
      "path": "/folder-123/Project Documents",
      "allowedFileTypes": ["documents", "images"],
      "fileCount": 15,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### **Get Folder Details**
```http
GET /folders/{folderId}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "folder": {
    "id": "folder-456",
    "name": "Project Documents",
    "parentId": "folder-123",
    "path": "/folder-123/Project Documents",
    "allowedFileTypes": ["documents", "images"],
    "description": "Folder for project-related documents",
    "fileCount": 15,
    "totalSize": 52428800,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### **Update Folder**
```http
PUT /folders/{folderId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Project Documents",
  "allowedFileTypes": ["documents", "images", "videos"],
  "description": "Updated folder description"
}
```

**Response:**
```json
{
  "success": true,
  "folder": {
    "id": "folder-456",
    "name": "Updated Project Documents",
    "allowedFileTypes": ["documents", "images", "videos"],
    "description": "Updated folder description",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### **Delete Folder**
```http
DELETE /folders/{folderId}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Folder deleted successfully"
}
```

### **Sharing Endpoints**

#### **Create Share Link**
```http
POST /shares
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "fileId": "file-123",
  "recipients": ["user1@example.com", "user2@example.com"],
  "expiresAt": "2024-01-22T10:30:00Z",
  "password": "optional-password",
  "maxDownloads": 100,
  "message": "Please find the attached document"
}
```

**Response:**
```json
{
  "success": true,
  "share": {
    "id": "share-789",
    "fileId": "file-123",
    "shareUrl": "https://cloudvault.com/share/share-789",
    "recipients": ["user1@example.com", "user2@example.com"],
    "expiresAt": "2024-01-22T10:30:00Z",
    "password": "optional-password",
    "maxDownloads": 100,
    "downloadCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### **Get Share Details**
```http
GET /shares/{shareId}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "share": {
    "id": "share-789",
    "fileId": "file-123",
    "shareUrl": "https://cloudvault.com/share/share-789",
    "recipients": ["user1@example.com", "user2@example.com"],
    "expiresAt": "2024-01-22T10:30:00Z",
    "password": "optional-password",
    "maxDownloads": 100,
    "downloadCount": 5,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastAccessedAt": "2024-01-16T09:15:00Z"
  }
}
```

#### **Download Shared File**
```http
GET /shares/{shareId}/download
Content-Type: application/json

{
  "password": "optional-password"
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://s3.amazonaws.com/bucket/downloads/file-123.pdf?signature=abc123...",
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

#### **Delete Share**
```http
DELETE /shares/{shareId}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Share deleted successfully"
}
```

### **Analytics Endpoints**

#### **Get Usage Statistics**
```http
GET /analytics/usage?period=30d&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "usage": {
    "totalFiles": 150,
    "totalSize": 1073741824,
    "uploads": {
      "count": 25,
      "size": 104857600
    },
    "downloads": {
      "count": 100,
      "size": 524288000
    },
    "shares": {
      "created": 10,
      "accessed": 50
    },
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  }
}
```

#### **Get Performance Metrics**
```http
GET /analytics/performance?period=7d
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "performance": {
    "averageResponseTime": 150,
    "p95ResponseTime": 300,
    "p99ResponseTime": 500,
    "errorRate": 0.01,
    "throughput": 1000,
    "period": {
      "start": "2024-01-08T00:00:00Z",
      "end": "2024-01-15T23:59:59Z"
    }
  }
}
```

#### **Get Activity Report**
```http
GET /analytics/activity?period=30d&type=uploads
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y)
- `type` (optional): Activity type (uploads, downloads, shares, views)

**Response:**
```json
{
  "success": true,
  "activity": [
    {
      "date": "2024-01-15",
      "count": 25,
      "size": 104857600,
      "type": "uploads"
    },
    {
      "date": "2024-01-14",
      "count": 20,
      "size": 83886080,
      "type": "uploads"
    }
  ],
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

## **Error Handling**

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123"
  }
}
```

### **Error Codes**

#### **Authentication Errors**
- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: Insufficient permissions
- `TOKEN_EXPIRED`: Authentication token has expired
- `INVALID_CREDENTIALS`: Invalid login credentials

#### **Validation Errors**
- `VALIDATION_ERROR`: Invalid input data
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `INVALID_FORMAT`: Invalid data format
- `FILE_TOO_LARGE`: File size exceeds limit
- `UNSUPPORTED_FILE_TYPE`: File type not supported

#### **Resource Errors**
- `FILE_NOT_FOUND`: File does not exist
- `FOLDER_NOT_FOUND`: Folder does not exist
- `SHARE_NOT_FOUND`: Share link does not exist
- `USER_NOT_FOUND`: User does not exist

#### **System Errors**
- `INTERNAL_SERVER_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `STORAGE_QUOTA_EXCEEDED`: Storage quota exceeded

## **Rate Limiting**

### **Rate Limits**
- **Authentication**: 10 requests per minute
- **File Operations**: 100 requests per minute
- **Analytics**: 50 requests per minute
- **General API**: 1000 requests per hour

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## **Pagination**

### **Pagination Parameters**
- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

### **Pagination Response**
```json
{
  "data": [...],
  "pagination": {
    "total": 1000,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "nextOffset": 20
  }
}
```

## **Webhooks**

### **Webhook Events**
- `file.uploaded`: File uploaded successfully
- `file.downloaded`: File downloaded
- `file.shared`: File shared
- `file.deleted`: File deleted
- `folder.created`: Folder created
- `folder.deleted`: Folder deleted
- `user.registered`: User registered
- `user.login`: User logged in

### **Webhook Payload**
```json
{
  "event": "file.uploaded",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "fileId": "file-123",
    "userId": "user-123",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "folderId": "folder-123"
  }
}
```

## **SDK Examples**

### **JavaScript/TypeScript**
```typescript
import { CloudVaultClient } from '@cloudvault/sdk';

const client = new CloudVaultClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.cloudvault.com/v1'
});

// Upload file
const file = await client.files.upload({
  file: fileData,
  folderId: 'folder-123',
  tags: ['important', 'work']
});

// List files
const files = await client.files.list({
  folderId: 'folder-123',
  limit: 20,
  offset: 0
});

// Create share
const share = await client.shares.create({
  fileId: 'file-123',
  recipients: ['user@example.com'],
  expiresAt: '2024-01-22T10:30:00Z'
});
```

### **Python**
```python
from cloudvault import CloudVaultClient

client = CloudVaultClient(
    api_key='your-api-key',
    base_url='https://api.cloudvault.com/v1'
)

# Upload file
file = client.files.upload(
    file=file_data,
    folder_id='folder-123',
    tags=['important', 'work']
)

# List files
files = client.files.list(
    folder_id='folder-123',
    limit=20,
    offset=0
)

# Create share
share = client.shares.create(
    file_id='file-123',
    recipients=['user@example.com'],
    expires_at='2024-01-22T10:30:00Z'
)
```

---

This API documentation provides comprehensive information about all available endpoints, request/response formats, error handling, and integration examples for the CloudVault platform.
