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
