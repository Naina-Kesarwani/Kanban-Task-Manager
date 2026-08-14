import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  infoMessage = '';
  isLoading = false;
  isGoogleLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  async onGoogleSignUp() {
    console.log('🔐 === GOOGLE SIGNUP START ===');
    
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
    this.isGoogleLoading = true;

    try {
      // Use signUpWithGoogle instead of signInWithGoogle
      const result = await this.authService.signUpWithGoogle();
      console.log('📊 Google signup result:', result);
      
      this.isGoogleLoading = false;

      if (result.success) {
        console.log('✅ Google signup successful');
        this.successMessage = '🎉 Account created successfully with Google!';
        
        // Wait a bit and manually navigate if auth service doesn't redirect
        setTimeout(() => {
          if (this.router.url === '/signup') {
            console.log('🔄 Manual redirect to /kanban');
            this.router.navigate(['/kanban']);
          }
        }, 500);
      } else {
        console.error('❌ Google signup failed:', result.error);
        
        // Combine error and info into single message
        if (result.error?.includes('already registered')) {
          this.errorMessage = (result.error || '❌ Google sign-up failed.') + ' Already have an account? Click "Sign In" below to log in.';
        } else {
          this.errorMessage = result.error || '❌ Google sign-up failed. Please try again.';
        }
      }
    } catch (error) {
      console.error('💥 Unexpected error during Google signup:', error);
      this.isGoogleLoading = false;
      this.errorMessage = '❌ Failed to sign up with Google. Please try again.';
    }

    console.log('🔐 === GOOGLE SIGNUP END ===');
  }

  async onSignup() {
    console.log('🔐 === SIGNUP ATTEMPT START ===');
    console.log('📧 Email:', this.email);
    console.log('🔑 Password length:', this.password.length);
    console.log('🔑 Confirm password length:', this.confirmPassword.length);

    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';

    // Validation
    if (!this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = '⚠️ Please fill in all fields';
      console.log('❌ Validation failed: Empty fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = '📧 Please enter a valid email address';
      console.log('❌ Validation failed: Invalid email format');
      return;
    }

    // Password match validation
    if (this.password !== this.confirmPassword) {
      this.errorMessage = '🔒 Passwords do not match. Please make sure both passwords are identical.';
      console.log('❌ Validation failed: Passwords mismatch');
      return;
    }

    // Password length validation
    if (this.password.length < 6) {
      this.errorMessage = '🔒 Password must be at least 6 characters. Use a mix of letters, numbers, and symbols for better security.';
      console.log('❌ Validation failed: Password too short');
      return;
    }

    console.log('✅ Validation passed, calling authService.signUp()...');
    this.isLoading = true;

    try {
      const result = await this.authService.signUp(this.email, this.password);
      
      console.log('📊 SignUp result:', result);
      this.isLoading = false;

      if (result.success) {
        console.log('✅ Signup successful');
        this.successMessage = '🎉 Account created successfully! Welcome to Kanban Task Manager.';
        
        // Redirect immediately or wait for auth service
        setTimeout(() => {
          if (this.router.url === '/signup') {
            console.log('🔄 Manual redirect to /kanban');
            this.router.navigate(['/kanban']);
          }
        }, 500);
      } else {
        console.error('❌ Signup failed:', result.error);
        
        // Combine error and info into single message
        if (result.error?.includes('already registered')) {
          this.errorMessage = (result.error || '❌ Signup failed.') + ' Already have an account? Click "Sign In" below to log in.';
        } else {
          this.errorMessage = result.error || '❌ Signup failed. Please try again.';
        }
      }
    } catch (error) {
      console.error('💥 Unexpected error during signup:', error);
      this.isLoading = false;
      this.errorMessage = '⚠️ An unexpected error occurred. Please try again.';
    }

    console.log('🔐 === SIGNUP ATTEMPT END ===');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}