// src/app/components/kanban-column/kanban-column.ts
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Column, Task } from '../../models/task.model';
import { TaskCardComponent } from '../task-card/task-card';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskCardComponent],
  templateUrl: './kanban-column.html',
  styleUrls: ['./kanban-column.css']
})
export class KanbanColumnComponent {
  @Input() column!: Column;
  @Input() connectedDropLists: string[] = [];
  @Output() drop = new EventEmitter<CdkDragDrop<Task[]>>();
  @Output() addTask = new EventEmitter<string>();
  @Output() editTask = new EventEmitter<{ columnId: string, task: Task }>();
  @Output() deleteTask = new EventEmitter<{ columnId: string, taskId: string }>();
  @Output() updateTask = new EventEmitter<{ columnId: string, task: Task }>();
  @Output() deleteColumn = new EventEmitter<string>();
  @Output() updateColumnTitle = new EventEmitter<{ columnId: string, title: string }>();

  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;

  isEditingTitle = false;
  editedTitle = '';

  onDrop(event: CdkDragDrop<Task[]>) {
    this.drop.emit(event);
  }

  onAddTask() {
    this.addTask.emit(this.column.id);
  }

  onEditTask(task: Task) {
    this.editTask.emit({ columnId: this.column.id, task });
  }

  onDeleteTask(taskId: string) {
    this.deleteTask.emit({ columnId: this.column.id, taskId });
  }

  onUpdateTask(task: Task) {
    this.updateTask.emit({ columnId: this.column.id, task });
  }

  onDeleteColumn() {
    if (confirm(`Are you sure you want to delete the column "${this.column.title}"?`)) {
      this.deleteColumn.emit(this.column.id);
    }
  }

  startEditTitle() {
    this.isEditingTitle = true;
    this.editedTitle = this.column.title;
    setTimeout(() => {
      this.titleInput?.nativeElement.focus();
      this.titleInput?.nativeElement.select();
    });
  }

  saveTitle() {
    if (this.editedTitle.trim() && this.editedTitle.trim() !== this.column.title) {
      this.updateColumnTitle.emit({ 
        columnId: this.column.id, 
        title: this.editedTitle.trim() 
      });
    }
    this.isEditingTitle = false;
  }

  cancelEditTitle() {
    this.isEditingTitle = false;
    this.editedTitle = this.column.title;
  }
}