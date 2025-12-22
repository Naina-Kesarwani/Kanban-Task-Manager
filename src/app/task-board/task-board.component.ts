import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskColumnComponent } from '../task-column/task-column.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { NotificationService } from '../notification.service';

export interface Task {
  id: string;
  name: string;
  description: string;
  level: 'Easy' | 'Medium' | 'Hard';
}

export interface Column {
  id: string;
  name: string;
  tasks: Task[];
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, TaskColumnComponent, TaskFormComponent],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.css']
})
export class TaskBoardComponent implements OnInit {
  columns: Column[] = [];
  showColumnForm = false;
  draggedColumnId: string | null = null;
  draggedTaskId: string | null = null;
  draggedFromColumnId: string | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadFromLocalStorage();
    if (this.columns.length === 0) {
      this.initializeDefaultColumns();
    }
  }

  initializeDefaultColumns() {
    this.columns = [
      { id: this.generateId(), name: 'To Do', tasks: [] },
      { id: this.generateId(), name: 'In Progress', tasks: [] },
      { id: this.generateId(), name: 'Done', tasks: [] }
    ];
    this.saveToLocalStorage();
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  addColumn(name: string) {
    const newColumn: Column = {
      id: this.generateId(),
      name: name,
      tasks: []
    };
    this.columns.push(newColumn);
    this.saveToLocalStorage();
    this.showColumnForm = false;
  }

  deleteColumn(columnId: string) {
    if (confirm('Are you sure you want to delete this column?')) {
      this.columns = this.columns.filter(col => col.id !== columnId);
      this.saveToLocalStorage();
    }
  }

  addTask(columnId: string, task: Task) {
    const column = this.columns.find(col => col.id === columnId);
    if (column) {
      column.tasks.push(task);
      this.saveToLocalStorage();
    }
  }

  updateTask(columnId: string, updatedTask: Task) {
    const column = this.columns.find(col => col.id === columnId);
    if (column) {
      const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id);
      if (taskIndex !== -1) {
        column.tasks[taskIndex] = updatedTask;
        this.saveToLocalStorage();
      }
    }
  }

  deleteTask(columnId: string, taskId: string) {
    const column = this.columns.find(col => col.id === columnId);
    if (column) {
      column.tasks = column.tasks.filter(t => t.id !== taskId);
      this.saveToLocalStorage();
    }
  }

  // Column Drag & Drop
  onColumnDragStart(columnId: string, event: DragEvent) {
    this.draggedColumnId = columnId;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', event.target as any);
    (event.target as HTMLElement).classList.add('dragging');
  }

  onColumnDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    this.draggedColumnId = null;
  }

  onColumnDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onColumnDrop(targetColumnId: string, event: DragEvent) {
    event.preventDefault();
    if (this.draggedColumnId && this.draggedColumnId !== targetColumnId) {
      const draggedIndex = this.columns.findIndex(col => col.id === this.draggedColumnId);
      const targetIndex = this.columns.findIndex(col => col.id === targetColumnId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = this.columns.splice(draggedIndex, 1);
        this.columns.splice(targetIndex, 0, removed);
        this.saveToLocalStorage();
      }
    }
  }

  // Task Drag & Drop
  onTaskDragStart(columnId: string, taskId: string, event: DragEvent) {
    this.draggedTaskId = taskId;
    this.draggedFromColumnId = columnId;
    event.dataTransfer!.effectAllowed = 'move';
    event.stopPropagation();
  }

  onTaskDragEnd(event: DragEvent) {
    this.draggedTaskId = null;
    this.draggedFromColumnId = null;
  }

  onTaskDrop(targetColumnId: string, event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggedTaskId && this.draggedFromColumnId) {
      const fromColumn = this.columns.find(col => col.id === this.draggedFromColumnId);
      const toColumn = this.columns.find(col => col.id === targetColumnId);

      if (fromColumn && toColumn) {
        const taskIndex = fromColumn.tasks.findIndex(t => t.id === this.draggedTaskId);
        if (taskIndex !== -1) {
          const [task] = fromColumn.tasks.splice(taskIndex, 1);
          toColumn.tasks.push(task);
          this.saveToLocalStorage();
          
          // Show notification after drag and drop
          this.notificationService.show(`Task moved to ${toColumn.name}!`, 'success');
        }
      }
    }
  }

  // Local Storage
  saveToLocalStorage() {
    localStorage.setItem('kanban-columns', JSON.stringify(this.columns));
  }

  loadFromLocalStorage() {
    const stored = localStorage.getItem('kanban-columns');
    if (stored) {
      this.columns = JSON.parse(stored);
    }
  }
}