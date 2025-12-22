import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  User
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private router = inject(Router);
  
  user$ = user(this.auth);
  currentUser = signal<User | null>(null);

  constructor() {
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  // Sign up with email and password
  async signUp(email: string, password: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('User signed up:', userCredential.user);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw this.handleError(error);
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('User signed in:', userCredential.user);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw this.handleError(error);
    }
  }

  // Sign out
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  // Handle Firebase errors
  private handleError(error: any): Error {
    let message = 'An error occurred';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/user-not-found':
        message = 'No user found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password';
        break;
    }
    
    return new Error(message);
  }
}