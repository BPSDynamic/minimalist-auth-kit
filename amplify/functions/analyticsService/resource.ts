import { defineFunction } from '@aws-amplify/backend';

export const analyticsService = defineFunction({
  name: 'analyticsService',
  entry: './handler.ts',
  runtime: 20, // Node.js 20
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    ANALYTICS_TABLE: '${env.ANALYTICS_TABLE}',
    REGION: '${env.AWS_REGION}',
  },
  bundle: {
    externalModules: ['aws-sdk'],
  },
});
