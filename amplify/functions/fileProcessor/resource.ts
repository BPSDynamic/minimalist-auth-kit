import { defineFunction } from '@aws-amplify/backend';

export const fileProcessor = defineFunction({
  name: 'fileProcessor',
  entry: './handler.ts',
  runtime: 20, // Node.js 20
  timeoutSeconds: 300, // 5 minutes for file processing
  memoryMB: 1024, // 1GB for image processing
  environment: {
    BUCKET_NAME: '${env.BUCKET_NAME}',
    REGION: '${env.AWS_REGION}',
  },
  bundle: {
    externalModules: ['aws-sdk'], // AWS SDK is provided by Lambda runtime
  },
});
