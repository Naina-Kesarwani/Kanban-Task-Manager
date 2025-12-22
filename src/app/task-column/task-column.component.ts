import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Column, Task } from '../task-board/task-board.component';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-task-column',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, TaskFormComponent],
  templateUrl: './task-column.component.html',
  styleUrls: ['./task-column.component.css']
})
export class TaskColumnComponent {
  @Input() column!: Column;
  @Output() addTask = new EventEmitter<Task>();
  @Output() updateTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<string>();
  @Output() deleteColumn = new EventEmitter<void>();
  @Output() taskDragStart = new EventEmitter<{ taskId: string; event: DragEvent }>();
  @Output() taskDragEnd = new EventEmitter<DragEvent>();
  @Output() taskDrop = new EventEmitter<DragEvent>();

  showTaskForm = false;
  editingTask: Task | null = null;

  constructor(private notificationService: NotificationService) {}

  onAddTask(taskData: any) {
    const newTask: Task = {
      id: this.generateId(),
      name: taskData.name,
      description: taskData.description,
      level: taskData.level
    };
    this.addTask.emit(newTask);
    this.showTaskForm = false;
  }

  onEditTask(task: Task) {
    this.editingTask = task;
    this.showTaskForm = true;
  }

  onUpdateTask(taskData: any) {
    if (this.editingTask) {
      const updatedTask: Task = {
        ...this.editingTask,
        name: taskData.name,
        description: taskData.description,
        level: taskData.level
      };
      this.updateTask.emit(updatedTask);
      this.showTaskForm = false;
      this.editingTask = null;
    }
  }

  onDeleteTask(taskId: string) {
    if (confirm('Delete this task?')) {
      this.deleteTask.emit(taskId);
      // Show notification after delete
      this.notificationService.show('Task deleted successfully!', 'success');
    }
  }

  onDeleteColumn() {
    this.deleteColumn.emit();
  }

  cancelForm() {
    this.showTaskForm = false;
    this.editingTask = null;
  }

  onTaskDragStart(taskId: string, event: DragEvent) {
    this.taskDragStart.emit({ taskId, event });
  }

  onTaskDragEnd(event: DragEvent) {
    this.taskDragEnd.emit(event);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.taskDrop.emit(event);
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}