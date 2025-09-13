import { defineFunction } from '@aws-amplify/backend';

export const backupService = defineFunction({
  name: 'backupService',
  entry: './handler.ts',
  runtime: 20, // Node.js 20
  timeoutSeconds: 900, // 15 minutes for backup operations
  memoryMB: 1024,
  environment: {
    SOURCE_BUCKET: '${env.SOURCE_BUCKET}',
    BACKUP_BUCKET: '${env.BACKUP_BUCKET}',
    REGION: '${env.AWS_REGION}',
    BACKUP_RETENTION_DAYS: '${env.BACKUP_RETENTION_DAYS}',
  },
  bundle: {
    externalModules: ['aws-sdk'],
  },
});
