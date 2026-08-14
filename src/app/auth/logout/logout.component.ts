import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userEmail: string = '';
  isLoggingOut = false;

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.userEmail = currentUser?.email || 'User';
  }

  async onConfirmLogout() {
    this.isLoggingOut = true;
    
    try {
      await this.authService.signOut();
      // Navigation is handled in auth.service.ts
    } catch (error) {
      console.error('Logout error:', error);
      this.isLoggingOut = false;
      alert('Failed to logout. Please try again.');
    }
  }

  onCancel() {
    this.router.navigate(['/kanban']);
  }
}