import { signUp, signIn, signOut, confirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ConfirmSignUpData {
  email: string;
  code: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

class AuthService {
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Listen for auth state changes
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          this.getCurrentUser().then(user => {
            this.notifyAuthStateListeners(user);
          });
          break;
        case 'signedOut':
          this.notifyAuthStateListeners(null);
          break;
        case 'tokenRefresh':
          this.getCurrentUser().then(user => {
            this.notifyAuthStateListeners(user);
          });
          break;
      }
    });
  }

  // Add auth state listener
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of auth state changes
  private notifyAuthStateListeners(user: AuthUser | null) {
    this.authStateListeners.forEach(callback => callback(user));
  }

  // Sign up a new user
  async signUp(data: SignUpData) {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
          },
        },
      });

      return {
        success: true,
        isSignUpComplete,
        userId,
        nextStep,
        message: 'Account created successfully! Please check your email for verification code.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create account',
      };
    }
  }

  // Confirm sign up with verification code
  async confirmSignUp(data: ConfirmSignUpData) {
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });

      return {
        success: true,
        isSignUpComplete,
        message: 'Email verified successfully! You can now sign in.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify email',
      };
    }
  }

  // Resend verification code
  async resendVerificationCode(email: string) {
    try {
      await resendSignUpCode({ username: email });
      return {
        success: true,
        message: 'Verification code sent to your email',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resend verification code',
      };
    }
  }

  // Sign in
  async signIn(data: SignInData) {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: data.email,
        password: data.password,
      });

      if (isSignedIn) {
        const user = await this.getCurrentUser();
        this.notifyAuthStateListeners(user);
        return {
          success: true,
          user,
          message: 'Signed in successfully!',
        };
      }

      return {
        success: false,
        error: 'Sign in failed',
      };
    } catch (error: any) {
      // Handle the "already signed in" error specifically
      if (error.message && error.message.includes('already a signed in user')) {
        try {
          // Sign out the existing user and try again
          await signOut();
          const { isSignedIn } = await signIn({
            username: data.email,
            password: data.password,
          });

          if (isSignedIn) {
            const user = await this.getCurrentUser();
            this.notifyAuthStateListeners(user);
            return {
              success: true,
              user,
              message: 'Signed in successfully!',
            };
          }
        } catch (retryError: any) {
          return {
            success: false,
            error: retryError.message || 'Failed to sign in after retry',
          };
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to sign in',
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut();
      this.notifyAuthStateListeners(null);
      return {
        success: true,
        message: 'Signed out successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sign out',
      };
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordData) {
    try {
      const { nextStep } = await resetPassword({ username: data.email });
      return {
        success: true,
        nextStep,
        message: 'Password reset code sent to your email',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send password reset code',
      };
    }
  }

  // Confirm reset password
  async confirmResetPassword(data: ConfirmResetPasswordData) {
    try {
      await confirmResetPassword({
        username: data.email,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      });

      return {
        success: true,
        message: 'Password reset successfully! You can now sign in with your new password.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      return {
        id: currentUser.userId,
        email: attributes.email || '',
        firstName: attributes.given_name || '',
        lastName: attributes.family_name || '',
        isEmailVerified: attributes.email_verified || false,
      };
    } catch (error) {
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
