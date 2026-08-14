// src/app/components/task-modal/task-modal.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-modal.html',
  styleUrls: ['./task-modal.css']
})
export class TaskModalComponent implements OnInit, OnChanges {
  @Input() showModal = false;
  @Input() isEditing = false;
  @Input() task!: Task;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Task>();

  currentTask: Task = this.createEmptyTask();

  ngOnInit() {
    // Initialize currentTask when component loads
    if (this.task) {
      this.currentTask = { ...this.task };
    } else {
      this.currentTask = this.createEmptyTask();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update currentTask whenever task input changes
    if (changes['task']) {
      if (this.task) {
        this.currentTask = { ...this.task };
      } else {
        this.currentTask = this.createEmptyTask();
      }
    }
    
    // Reset form when modal opens for new task
    if (changes['showModal'] && this.showModal && !this.isEditing) {
      this.currentTask = { ...this.task };
    }
  }

  private createEmptyTask(): Task {
    return {
      id: '',
      title: '',
      description: '',
      priority: 'Medium',
      status: 'TO DO',
      createdAt: new Date(),
      updatedAt: new Date(),
      timeSpent: 0,
      isTimerRunning: false
    };
  }

  onClose() {
    // Reset form when closing
    this.currentTask = this.createEmptyTask();
    this.close.emit();
  }

  onSave() {
    // Validate required fields
    if (!this.currentTask.title || !this.currentTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    // Emit the task data
    this.save.emit({ ...this.currentTask });
    
    // Reset form after save
    this.currentTask = this.createEmptyTask();
  }

  onOverlayClick() {
    this.onClose();
  }

  onModalClick(event: Event) {
    event.stopPropagation();
  }
}