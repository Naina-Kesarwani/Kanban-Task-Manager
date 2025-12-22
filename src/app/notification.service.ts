import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 3000) {
    const notification: Notification = {
      id: Date.now(),
      message,
      type
    };
    
    this.notificationSubject.next(notification);

    setTimeout(() => {
      this.notificationSubject.next(null);
    }, duration);
  }

  clear() {
    this.notificationSubject.next(null);
  }
}
