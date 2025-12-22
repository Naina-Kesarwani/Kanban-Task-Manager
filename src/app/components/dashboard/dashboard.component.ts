import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskBoardComponent } from '../../task-board/task-board.component';
import { NotificationComponent } from '../../notification/notification.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TaskBoardComponent, NotificationComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  get userEmail(): string {
    return this.authService.currentUser()?.email || 'User';
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}