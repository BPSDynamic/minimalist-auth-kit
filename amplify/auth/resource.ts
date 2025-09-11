import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your authentication resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Welcome to CloudVault! Verify your email',
      verificationEmailBody: (createCode) =>
        `Welcome to CloudVault! Your verification code is: ${createCode()}`,
      verificationEmailStyle: 'CODE',
    },
  },
  userAttributes: {
    email: {
      required: true,
    },
    givenName: {
      required: true,
    },
    familyName: {
      required: true,
    },
  },
  accountRecovery: ['email'],
  mfa: {
    mode: 'OPTIONAL',
    totp: true,
    sms: false,
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
});
