import { defineFunction } from '@aws-amplify/backend';

export const fileService = defineFunction({
  name: 'fileService',
  entry: './handler.ts',
  runtime: 20, // Node.js 20
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    FILES_TABLE: '${env.FILES_TABLE}',
    FOLDERS_TABLE: '${env.FOLDERS_TABLE}',
    BUCKET_NAME: '${env.BUCKET_NAME}',
    REGION: '${env.AWS_REGION}',
  },
  bundle: {
    externalModules: ['aws-sdk'],
  },
});
