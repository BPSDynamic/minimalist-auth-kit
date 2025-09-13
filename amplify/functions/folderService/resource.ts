import { defineFunction } from '@aws-amplify/backend';

export const folderService = defineFunction({
  name: 'folderService',
  entry: './handler.ts',
  runtime: 20, // Node.js 20
  timeoutSeconds: 30,
  memoryMB: 512,
  environment: {
    FOLDERS_TABLE: '${env.FOLDERS_TABLE}',
    FILES_TABLE: '${env.FILES_TABLE}',
    BUCKET_NAME: '${env.BUCKET_NAME}',
    REGION: '${env.AWS_REGION}',
  },
  bundle: {
    externalModules: ['aws-sdk'],
  },
});
