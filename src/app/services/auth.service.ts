import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  user,
  User,
  getAdditionalUserInfo,
  deleteUser
} from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private router = inject(Router);

  user$ = user(this.auth);
  currentUserSignal = signal<User | null | undefined>(undefined);

  constructor() {
    this.user$.subscribe(user => {
      this.currentUserSignal.set(user);
      if (user) {
        const currentRoute = this.router.url;
        if (currentRoute === '/login' || currentRoute === '/signup') {
          console.log('✅ User authenticated, redirecting to /kanban');
          this.router.navigate(['/kanban']);
        }
      }
    });
  }

  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Signup successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; needsSignup?: boolean }> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Signin successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Signin error:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        return {
          success: false,
          error: '🚫 No account found with this email. Please sign up first.',
          needsSignup: true
        };
      }

      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // SIGNUP with Google - Only allows NEW users
  async signUpWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(this.auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);

      if (!additionalInfo?.isNewUser) {
        await signOut(this.auth);

        return {
          success: false,
          error: '🚫 This email is already registered. Please use "Sign In" instead.'
        };
      }

      console.log('✅ Google signup successful:', result.user.email);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Google signup error:', error);

      if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          error: '🚫 Popup was blocked. Please allow popups for this site.'
        };
      }

      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: '❌ Sign-up cancelled. Please try again.'
        };
      }

      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // LOGIN with Google - Allows ANY existing user (Google OR Email/Password)
  async signInWithGoogle(): Promise<{
    success: boolean;
    error?: string;
    needsSignup?: boolean;
  }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(this.auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        // Remove the account Firebase automatically created during sign-in.
        await deleteUser(result.user);

        return {
          success: false,
          error: '🚫 No account found with this email. Please sign up first.',
          needsSignup: true
        };
      }

      console.log('✅ Google signin successful:', result.user.email);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Google signin error:', error);

      if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          error: '🚫 Popup was blocked. Please allow popups for this site.'
        };
      }

      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: '❌ Sign-in cancelled. Please try again.'
        };
      }

      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('❌ Signout error:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  isLoggedIn(): boolean {
    return this.auth.currentUser !== null;
  }

  getUserEmail(): string | null {
    return this.auth.currentUser?.email || null;
  }

  getUserDisplayName(): string | null {
    return this.auth.currentUser?.displayName || null;
  }

  getUserPhotoURL(): string | null {
    return this.auth.currentUser?.photoURL || null;
  }

  private getErrorMessage(errorCode: string): string {
    const messages: { [key: string]: string } = {
      'auth/email-already-in-use': '🚫 This email is already registered. Please sign in instead.',
      'auth/invalid-email': '📧 Invalid email address.',
      'auth/weak-password': '🔒 Password must be at least 6 characters.',
      'auth/user-not-found': '🚫 No account found. Please sign up first.',
      'auth/wrong-password': '🔒 Incorrect password.',
      'auth/invalid-credential': '🚫 Invalid email or password.',
      'auth/too-many-requests': '⏸️ Too many attempts. Please wait.',
      'auth/network-request-failed': '🌐 Network error. Check connection.',
      'auth/popup-blocked': '🚫 Popup blocked. Please allow popups.',
      'auth/popup-closed-by-user': '❌ Sign-in cancelled.',
      'auth/unauthorized-domain': '🚫 This domain is not authorized. Add it in Firebase Console.',
    };
    return messages[errorCode] || `⚠️ Error: ${errorCode}`;
  }
}