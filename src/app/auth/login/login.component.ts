import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  infoMessage = '';
  isLoading = false;
  isGoogleLoading = false;
  showPassword = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private alertTimeout: any = null;

  /**
   * Auto-dismiss alerts after 4 seconds
   */
  private setAlertAutoDismiss() {
    // Clear any existing timeout
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    // Set new timeout to clear messages after 4 seconds
    this.alertTimeout = setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
      this.infoMessage = '';
    }, 4000);
  }

  async onGoogleSignIn() {
    console.log('🔐 === GOOGLE SIGNIN START ===');
    
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
    this.isGoogleLoading = true;

    try {
      const result = await this.authService.signInWithGoogle();
      console.log('📊 Google signin result:', result);
      
      this.isGoogleLoading = false;

      if (result.success) {
        console.log('✅ Google signin successful');
        // Navigation handled by auth service
      } else {
        console.error('❌ Google signin failed:', result.error);
        
        // Combine error and info into single message
        if (result.needsSignup) {
          this.errorMessage = (result.error || 'No account found with this email.') + ' New user? Click "Sign Up" below to create an account.';
        } else {
          this.errorMessage = result.error || 'Google sign-in failed. Please try again.';
        }

        // Auto-dismiss alerts
        this.setAlertAutoDismiss();
      }
    } catch (error) {
      console.error('💥 Unexpected error during Google signin:', error);
      this.isGoogleLoading = false;
      this.errorMessage = 'Failed to sign in with Google. Please try again.';
      
      // Auto-dismiss alerts
      this.setAlertAutoDismiss();
    }

    console.log('🔐 === GOOGLE SIGNIN END ===');
  }

  async onLogin() {
    console.log('🔐 === LOGIN ATTEMPT START ===');
    console.log('📧 Email:', this.email);
    console.log('🔑 Password length:', this.password.length);

    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';

    // Validation
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      console.log('❌ Validation failed: Empty fields');
      
      // Auto-dismiss alerts
      this.setAlertAutoDismiss();
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      console.log('❌ Validation failed: Invalid email format');
      
      // Auto-dismiss alerts
      this.setAlertAutoDismiss();
      return;
    }

    console.log('✅ Validation passed, calling authService.signIn()...');
    this.isLoading = true;

    try {
      const result = await this.authService.signIn(this.email, this.password);
      
      console.log('📊 SignIn result:', result);
      this.isLoading = false;

      if (result.success) {
        console.log('✅ Signin successful');
        this.successMessage = 'Welcome back!';
        
        // Auto-dismiss success message
        this.setAlertAutoDismiss();
        
        // Navigation handled by auth service
      } else {
        console.error('❌ Signin failed:', result.error);
        
        // Combine error and info into single message
        if (result.needsSignup) {
          this.errorMessage = (result.error || 'No account found with this email.') + ' New user? Click "Sign Up" below to create an account.';
        } else {
          this.errorMessage = result.error || 'Sign-in failed. Please try again.';
        }

        // Auto-dismiss alerts
        this.setAlertAutoDismiss();
      }
    } catch (error) {
      console.error('💥 Unexpected error during signin:', error);
      this.isLoading = false;
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Auto-dismiss alerts
      this.setAlertAutoDismiss();
    }

    console.log('🔐 === LOGIN ATTEMPT END ===');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Cleanup on component destroy
  ngOnDestroy() {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }
}