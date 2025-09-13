import { defineFunction } from '@aws-amplify/backend';

export const notificationService = defineFunction({
  name: 'notificationService',
  entry: './handler.ts',
  runtime: 20, // Node.js 20
  timeoutSeconds: 30,
  memoryMB: 256,
  environment: {
    SES_REGION: '${env.AWS_REGION}',
    SNS_TOPIC_ARN: '${env.SNS_TOPIC_ARN}',
  },
  bundle: {
    externalModules: ['aws-sdk'],
  },
});
