import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../task-board/task-board.component';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit {
  @Input() type: 'column' | 'task' = 'task';
  @Input() initialData: Task | null = null;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  formData = {
    name: '',
    description: '',
    level: 'Medium' as 'Easy' | 'Medium' | 'Hard'
  };

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    if (this.initialData) {
      this.formData = {
        name: this.initialData.name,
        description: this.initialData.description,
        level: this.initialData.level
      };
    }
  }

  onSubmit() {
    if (this.formData.name.trim()) {
      this.formSubmit.emit(this.formData);
      
      // Show notification based on whether it's create or update
      if (this.initialData) {
        this.notificationService.show('Task updated successfully!', 'success');
      } else {
        this.notificationService.show('Task created successfully!', 'success');
      }
      
      this.resetForm();
    }
  }

  onCancel() {
    this.resetForm();
    this.formCancel.emit();
  }

  resetForm() {
    this.formData = {
      name: '',
      description: '',
      level: 'Medium'
    };
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}