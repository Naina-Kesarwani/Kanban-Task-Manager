// src/app/components/task-card/task-card.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.css']
})
export class TaskCardComponent implements OnInit, OnDestroy {
  @Input() task!: Task;
  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<string>();
  @Output() updateTask = new EventEmitter<Task>();

  currentTimeSpent: number = 0;
  private timerInterval: any;

  ngOnInit() {
    this.currentTimeSpent = this.task.timeSpent || 0;
    
    // If timer is running, start the interval
    if (this.task.isTimerRunning) {
      this.startTimerInterval();
    }
  }

  ngOnDestroy() {
    this.clearTimerInterval();
  }

  onEdit() {
    this.editTask.emit(this.task);
  }

  onDelete() {
    this.deleteTask.emit(this.task.id);
  }

  toggleTimer() {
    if (this.task.isTimerRunning) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }

  private startTimer() {
    this.task.isTimerRunning = true;
    this.task.timerStartTime = Date.now();
    this.task.updatedAt = new Date();
    this.startTimerInterval();
    this.updateTask.emit(this.task);
  }

  private stopTimer() {
    if (this.task.timerStartTime) {
      const elapsed = Math.floor((Date.now() - this.task.timerStartTime) / 1000);
      this.task.timeSpent += elapsed;
      this.currentTimeSpent = this.task.timeSpent;
    }
    
    this.task.isTimerRunning = false;
    this.task.timerStartTime = undefined;
    this.task.updatedAt = new Date();
    this.clearTimerInterval();
    this.updateTask.emit(this.task);
  }

  private startTimerInterval() {
    this.clearTimerInterval();
    this.timerInterval = setInterval(() => {
      if (this.task.timerStartTime) {
        const elapsed = Math.floor((Date.now() - this.task.timerStartTime) / 1000);
        this.currentTimeSpent = this.task.timeSpent + elapsed;
      }
    }, 1000);
  }

  private clearTimerInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  formatDateCompact(date: Date): string {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); // Last 2 digits of year
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${month}/${day}/${year}, ${hours}:${minutes}`;
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  }
}