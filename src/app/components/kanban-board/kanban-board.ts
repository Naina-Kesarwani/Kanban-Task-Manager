import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Column, Task } from '../../models/task.model';
import { KanbanColumnComponent } from '../kanban-column/kanban-column';
import { TaskModalComponent } from '../task-modal/task-modal';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, KanbanColumnComponent, TaskModalComponent],
  templateUrl: './kanban-board.html',
  styleUrls: ['./kanban-board.css']
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  private readonly STORAGE_KEY = 'kanban-tasks';
  private readonly COLUMNS_STORAGE_KEY = 'kanban-columns';
  
  // User authentication properties
  userEmail: string = '';
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Search properties
  searchQuery: string = '';
  searchExpanded = false;
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  columns: Column[] = [
    { id: 'todo', title: 'TO DO', tasks: [] },
    { id: 'inprogress', title: 'IN PROGRESS', tasks: [] },
    { id: 'completed', title: 'COMPLETED', tasks: [] }
  ];

  // Store original unfiltered columns
  private originalColumns: Column[] = [];

  showModal = false;
  showSuccessNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'high' | 'medium' | 'low' = 'success';
  notificationFadeOut = false;
  showColumnModal = false;
  currentTask: Task = this.createEmptyTask();
  isEditing = false;
  newColumnTitle = '';
  private notificationTimeout: any;
  private fadeOutTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {}

  get connectedDropLists(): string[] {
    return this.columns.map(col => col.id);
  }

  ngOnInit() {
    // Get user email from auth service
    const currentUser = this.authService.getCurrentUser();
    this.userEmail = currentUser?.email || '';
    
    this.loadColumnsFromStorage();
    this.loadTasksFromStorage();
    
    // Check if columns are corrupted (empty titles)
    const hasCorruptedColumns = this.columns.some(col => !col.title || col.title.trim() === '');
    
    if (hasCorruptedColumns || this.columns.length === 0) {
      console.warn('Corrupted columns detected, resetting to defaults');
      this.resetToDefaults();
    }
    
    if (this.getAllTasksCount() === 0) {
      this.loadDefaultTasks();
    }

    // Store original columns after loading
    this.storeOriginalColumns();
  }

  ngOnDestroy() {
    // Clean up timeouts when component is destroyed
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    if (this.fadeOutTimeout) {
      clearTimeout(this.fadeOutTimeout);
    }
  }

  // Navigate to logout confirmation page
  onLogout(): void {
    this.router.navigate(['/logout']);
  }

  // Toggle search bar expansion
  toggleSearch() {
    this.searchExpanded = !this.searchExpanded;
    if (this.searchExpanded) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 100);
    }
  }

  // Handle search blur - collapse if empty
  onSearchBlur() {
    if (!this.searchQuery) {
      this.searchExpanded = false;
    }
  }

  // Store a deep copy of columns for filtering (ONLY call this after loading from storage)
  private storeOriginalColumns() {
    this.originalColumns = this.columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task => ({...task})) // Deep copy tasks too
    }));
    console.log('🔵 Original columns stored:', this.originalColumns.map(c => ({
      title: c.title,
      taskCount: c.tasks.length
    })));
  }

  // ============= FIXED: Filter tasks based on search query =============
  onSearchChange() {
    // If search is empty, restore from original columns
    if (!this.searchQuery || !this.searchQuery.trim()) {
      this.columns = this.originalColumns.map(col => ({
        ...col,
        tasks: [...col.tasks]
      }));
      this.cdr.detectChanges();
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();

    // Apply search filter to original columns
    this.columns = this.originalColumns.map(column => ({
      ...column,
      tasks: column.tasks.filter(task => {
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description.toLowerCase().includes(query);
        const matchesPriority = task.priority.toLowerCase().includes(query);
        return matchesTitle || matchesDescription || matchesPriority;
      })
    }));

    this.cdr.detectChanges();
  }

  // Clear search
  clearSearch() {
    this.searchQuery = '';
    this.onSearchChange();
  }

  private resetToDefaults() {
    this.columns = [
      { id: 'todo', title: 'TO DO', tasks: [] },
      { id: 'inprogress', title: 'IN PROGRESS', tasks: [] },
      { id: 'completed', title: 'COMPLETED', tasks: [] }
    ];
    this.saveColumnsToStorage();
    this.saveTasksToStorage();
  }

  private loadDefaultTasks() {
    this.columns[0].tasks = [
      {
        id: '1',
        title: 'text 6',
        description: 'done',
        priority: 'Medium',
        status: 'TO DO',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeSpent: 0,
        isTimerRunning: false,
        dueDate: '9/25/25, 6:20 PM'
      },
      {
        id: '2',
        title: 'Task B',
        description: 'complete milestone',
        priority: 'Medium',
        status: 'TO DO',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeSpent: 0,
        isTimerRunning: false,
        dueDate: '9/25/25, 6:25 PM'
      }
    ];
    this.columns[1].tasks = [
      {
        id: '3',
        title: 'Task 1',
        description: 'Complete Js',
        priority: 'High',
        status: 'IN PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeSpent: 0,
        isTimerRunning: false,
        dueDate: '9/25/25, 6:30 PM'
      },
      {
        id: '5',
        title: 'Task 2',
        description: 'milestone 1 is completed',
        priority: 'Low',
        status: 'IN PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeSpent: 0,
        isTimerRunning: false,
        dueDate: '9/25/25, 6:35 PM'
      }
    ];
    this.columns[2].tasks = [
      {
        id: '4',
        title: 'demo 1',
        description: 'complete react',
        priority: 'Medium',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeSpent: 0,
        isTimerRunning: false,
        dueDate: '9/25/25, 6:30 PM'
      },
      {
        id: '6',
        title: 'Task 1',
        description: 'Complete html',
        priority: 'Low',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeSpent: 0,
        isTimerRunning: false,
        dueDate: '9/25/25, 6:20 PM'
      }
    ];
    this.saveTasksToStorage();
  }

  private loadColumnsFromStorage() {
    try {
      const savedColumns = localStorage.getItem(this.COLUMNS_STORAGE_KEY);
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        if (parsedColumns.length > 0) {
          this.columns = parsedColumns.map((col: Column) => ({
            ...col,
            tasks: []
          }));
        }
      }
    } catch (error) {
      console.error('Error loading columns from localStorage:', error);
    }
  }

  private saveColumnsToStorage() {
    try {
      const columnsToSave = this.columns.map(col => ({
        id: col.id,
        title: col.title
      }));
      localStorage.setItem(this.COLUMNS_STORAGE_KEY, JSON.stringify(columnsToSave));
    } catch (error) {
      console.error('Error saving columns to localStorage:', error);
    }
  }

  private loadTasksFromStorage() {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.columns.forEach(column => {
          const savedColumn = parsedData.find((col: Column) => col.id === column.id);
          if (savedColumn && savedColumn.tasks) {
            column.tasks = savedColumn.tasks.map((task: any) => ({
              ...task,
              createdAt: new Date(task.createdAt),
              updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt),
              timeSpent: task.timeSpent || 0,
              isTimerRunning: false,
              timerStartTime: undefined
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    }
  }

  // ============= FIXED: Save tasks to storage =============
  private saveTasksToStorage() {
    try {
      // Save from original columns to preserve all tasks
      const dataToSave = this.originalColumns.map(column => ({
        id: column.id,
        title: column.title,
        tasks: column.tasks.map(task => ({
          ...task,
          // Ensure dates are properly serialized
          createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
          updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt
        }))
      }));
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('✅ Tasks saved to storage:', dataToSave); // Debug log
      
      // Update original columns after save
      this.storeOriginalColumns();
    } catch (error) {
      console.error('❌ Error saving tasks to localStorage:', error);
    }
  }

  private getAllTasksCount(): number {
    return this.columns.reduce((count, column) => count + column.tasks.length, 0);
  }

  private showNotification(message: string, type: 'success' | 'high' | 'medium' | 'low' = 'success') {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    if (this.fadeOutTimeout) {
      clearTimeout(this.fadeOutTimeout);
    }

    this.notificationMessage = message;
    this.notificationType = type;
    this.showSuccessNotification = true;
    this.notificationFadeOut = false;
    
    this.cdr.detectChanges();
    
    this.notificationTimeout = setTimeout(() => {
      this.notificationFadeOut = true;
      this.cdr.detectChanges();
      
      this.fadeOutTimeout = setTimeout(() => {
        this.showSuccessNotification = false;
        this.notificationMessage = '';
        this.notificationFadeOut = false;
        this.cdr.detectChanges();
      }, 300);
    }, 2700);
  }

  private getPriorityNotificationType(priority: 'Low' | 'Medium' | 'High'): 'high' | 'medium' | 'low' {
    return priority.toLowerCase() as 'high' | 'medium' | 'low';
  }

  private getPriorityIcon(priority: 'Low' | 'Medium' | 'High'): string {
    switch (priority) {
      case 'High': return '🔴';
      case 'Medium': return '🟠';
      case 'Low': return '🟢';
      default: return '🟠';
    }
  }

  createEmptyTask(): Task {
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

  onDropColumn(event: CdkDragDrop<Column[]>) {
    if (event.previousIndex !== event.currentIndex) {
      // Reorder BOTH arrays
      moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
      moveItemInArray(this.originalColumns, event.previousIndex, event.currentIndex);
      
      this.saveColumnsToStorage();
      this.saveTasksToStorage();
      this.cdr.detectChanges();
      
      this.showNotification('✅ Column order updated!', 'success');
      console.log('✅ Columns reordered');
    }
  }

  onAddColumn() {
    this.newColumnTitle = '';
    this.showColumnModal = true;
  }

  onSaveColumn() {
    if (!this.newColumnTitle.trim()) return;

    const newColumn: Column = {
      id: this.generateColumnId(this.newColumnTitle),
      title: this.newColumnTitle.toUpperCase(),
      tasks: []
    };

    // Add to BOTH arrays
    this.columns.push(newColumn);
    this.originalColumns.push({...newColumn, tasks: []});
    
    this.saveColumnsToStorage();
    this.saveTasksToStorage();
    this.cdr.detectChanges();
    
    this.showColumnModal = false;
    this.newColumnTitle = '';
    
    this.showNotification('✅ Column added successfully!', 'success');
    console.log('✅ Column added:', newColumn.title);
  }

  onDeleteColumn(columnId: string) {
    if (this.columns.length <= 1) {
      alert('Cannot delete the last column!');
      return;
    }

    const column = this.originalColumns.find(col => col.id === columnId);
    
    if (column && column.tasks.length > 0) {
      const confirmDelete = confirm(
        `Column "${column.title}" contains ${column.tasks.length} task(s). Delete anyway?`
      );
      if (!confirmDelete) return;
    }

    // Remove from BOTH arrays
    this.columns = this.columns.filter(col => col.id !== columnId);
    this.originalColumns = this.originalColumns.filter(col => col.id !== columnId);
    
    this.saveColumnsToStorage();
    this.saveTasksToStorage();
    this.cdr.detectChanges();
    
    this.showNotification('✅ Column deleted successfully!', 'success');
    console.log('✅ Column deleted:', columnId);
  }

  onCancelColumnModal() {
    this.showColumnModal = false;
    this.newColumnTitle = '';
  }

  private generateColumnId(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  }

  onAddTask(columnId: string) {
    const columnTitle = this.getColumnTitle(columnId);
    console.log('🔵 onAddTask called for column:', columnId, 'Title:', columnTitle);
    
    this.currentTask = this.createEmptyTask();
    this.currentTask.status = columnTitle as any;
    this.isEditing = false;
    this.showModal = true;
    
    console.log('🔵 Current task status set to:', this.currentTask.status);
  }

  onEditTask(event: { columnId: string, task: Task }) {
    this.currentTask = { ...event.task };
    this.isEditing = true;
    this.showModal = true;
  }

  // ============= FIXED: Delete task =============
  onDeleteTask(event: { columnId: string, taskId: string }) {
    console.log('🔵 onDeleteTask called:', event);
    
    let deletedTask: Task | undefined;
    let foundInColumn: string = '';
    
    // Find and remove from BOTH original and display columns
    this.originalColumns.forEach(column => {
      const taskIndex = column.tasks.findIndex(task => task.id === event.taskId);
      if (taskIndex > -1) {
        deletedTask = column.tasks[taskIndex];
        foundInColumn = column.title;
        column.tasks.splice(taskIndex, 1);
        console.log(`✅ Removed from originalColumns: "${deletedTask.title}" from "${foundInColumn}"`);
      }
    });
    
    // Also remove from display columns
    this.columns.forEach(column => {
      const taskIndex = column.tasks.findIndex(task => task.id === event.taskId);
      if (taskIndex > -1) {
        column.tasks.splice(taskIndex, 1);
        console.log(`✅ Removed from columns: "${foundInColumn}"`);
      }
    });
    
    if (deletedTask) {
      console.log(`✅ Total remaining in column: ${this.columns.find(c => c.title === foundInColumn)?.tasks.length || 0}`);
      
      // Save changes
      this.saveTasksToStorage();
      
      // Force change detection
      this.cdr.detectChanges();
      setTimeout(() => this.cdr.detectChanges(), 0);
      
      const priorityType = this.getPriorityNotificationType(deletedTask.priority);
      const priorityIcon = this.getPriorityIcon(deletedTask.priority);
      this.showNotification(
        `${priorityIcon} Task "${deletedTask.title}" deleted from ${foundInColumn}!`,
        priorityType
      );
      
      console.log('✅ Task deletion complete. Task ID:', event.taskId);
    } else {
      console.error('❌ Task not found for deletion. Task ID:', event.taskId);
      console.error('Available tasks:', this.originalColumns.map(col => ({
        column: col.title,
        taskIds: col.tasks.map(t => t.id)
      })));
      alert('Error: Task not found!');
    }
  }

  onUpdateTask(event: { columnId: string, task: Task }) {
    console.log('🔵 onUpdateTask called:', event);
    
    // Update in BOTH original and display columns
    let updated = false;
    
    this.originalColumns.forEach(column => {
      const taskIndex = column.tasks.findIndex(t => t.id === event.task.id);
      if (taskIndex !== -1) {
        column.tasks[taskIndex] = { ...event.task };
        updated = true;
      }
    });
    
    this.columns.forEach(column => {
      const taskIndex = column.tasks.findIndex(t => t.id === event.task.id);
      if (taskIndex !== -1) {
        column.tasks[taskIndex] = { ...event.task };
      }
    });
    
    if (updated) {
      this.saveTasksToStorage();
      this.cdr.detectChanges();
      setTimeout(() => this.cdr.detectChanges(), 0);
      console.log('✅ Task updated via timer/drag');
    }
  }

  onUpdateColumnTitle(event: { columnId: string, title: string }) {
    console.log('🔵 onUpdateColumnTitle:', event);
    
    // Update in BOTH arrays
    const column = this.columns.find(c => c.id === event.columnId);
    const originalColumn = this.originalColumns.find(c => c.id === event.columnId);
    
    if (column) {
      column.title = event.title;
    }
    if (originalColumn) {
      originalColumn.title = event.title;
      
      // Update all tasks in this column with new status
      originalColumn.tasks.forEach(task => {
        task.status = event.title as any;
      });
    }
    
    this.saveColumnsToStorage();
    this.saveTasksToStorage();
    this.cdr.detectChanges();
    
    this.showNotification('✅ Column title updated!', 'success');
    console.log('✅ Column title updated to:', event.title);
  }

  onCloseModal() {
    this.showModal = false;
    this.currentTask = this.createEmptyTask();
  }

  // ============= FIXED: Save task (Add/Edit) =============
  onSaveTask(task: Task) {
    console.log('🔵 onSaveTask called:', { editing: this.isEditing, task });
    
    if (!task.title.trim()) {
      alert('Task title is required!');
      return;
    }

    const priorityType = this.getPriorityNotificationType(task.priority);
    const priorityIcon = this.getPriorityIcon(task.priority);

    if (this.isEditing) {
      // EDITING EXISTING TASK
      let taskUpdated = false;
      let foundInColumn: string = '';
      
      this.originalColumns.forEach(column => {
        const taskIndex = column.tasks.findIndex(t => t.id === task.id);
        if (taskIndex > -1) {
          task.updatedAt = new Date();
          task.status = column.title as any;
          column.tasks[taskIndex] = { ...task };
          taskUpdated = true;
          foundInColumn = column.title;
        }
      });
      
      // Also update in display columns
      this.columns.forEach(column => {
        const taskIndex = column.tasks.findIndex(t => t.id === task.id);
        if (taskIndex > -1) {
          column.tasks[taskIndex] = { ...task };
        }
      });
      
      if (taskUpdated) {
        console.log('✅ Task updated:', task.title, 'in column:', foundInColumn);
        this.showNotification(
          `${priorityIcon} Task "${task.title}" updated! (${task.priority} Priority)`,
          priorityType
        );
      } else {
        console.error('❌ Task not found for editing:', task.id);
        alert('Error: Task not found!');
        return;
      }
    } else {
      // CREATING NEW TASK
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        timeSpent: 0,
        isTimerRunning: false
      };
      
      console.log('🔵 Creating new task:', newTask);
      console.log('🔵 Target status:', newTask.status);
      
      const targetOriginalColumn = this.originalColumns.find(col => col.title === newTask.status);
      const targetDisplayColumn = this.columns.find(col => col.title === newTask.status);
      
      console.log('🔵 Found original column:', targetOriginalColumn?.title);
      console.log('🔵 Found display column:', targetDisplayColumn?.title);
      
      if (targetOriginalColumn && targetDisplayColumn) {
        // Add to BOTH original and display columns
        targetOriginalColumn.tasks.push({ ...newTask });
        targetDisplayColumn.tasks.push({ ...newTask });
        
        console.log('✅ Task added to originalColumns. Total:', targetOriginalColumn.tasks.length);
        console.log('✅ Task added to columns. Total:', targetDisplayColumn.tasks.length);
        console.log('✅ Task created:', newTask.title);
        
        this.showNotification(
          `${priorityIcon} Task "${newTask.title}" created! (${newTask.priority} Priority)`,
          priorityType
        );
      } else {
        console.error('❌ Target columns not found:', newTask.status);
        console.error('Available original columns:', this.originalColumns.map(c => c.title));
        console.error('Available display columns:', this.columns.map(c => c.title));
        alert('Error: Could not find target column');
        return;
      }
    }

    // Save to storage
    this.saveTasksToStorage();
    
    // Force Angular to detect changes
    this.cdr.detectChanges();
    
    // Additional delayed detection to ensure UI updates
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('✅ Final change detection complete');
    }, 0);
    
    this.onCloseModal();
  }

  // ============= FIXED: Drag and drop =============
  onDrop(event: CdkDragDrop<Task[]>) {
    console.log('🔵 onDrop called:', {
      sameContainer: event.previousContainer === event.container,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    });
    
    if (event.previousContainer === event.container) {
      // Moving within same column
      const task = event.previousContainer.data[event.previousIndex];
      console.log('🔵 Reordering task within column:', task.title);
      
      // Find the column in BOTH arrays
      const displayColumnIndex = this.columns.findIndex(col => col.tasks === event.container.data);
      
      if (displayColumnIndex !== -1) {
        const originalColumn = this.originalColumns[displayColumnIndex];
        const displayColumn = this.columns[displayColumnIndex];
        
        // Update both arrays
        moveItemInArray(originalColumn.tasks, event.previousIndex, event.currentIndex);
        moveItemInArray(displayColumn.tasks, event.previousIndex, event.currentIndex);
        
        this.saveTasksToStorage();
        this.cdr.detectChanges();
        
        console.log('✅ Task reordered within column:', originalColumn.title);
      }
    } else {
      // Moving between columns
      const task = event.previousContainer.data[event.previousIndex];
      console.log('🔵 Moving task between columns:', task.title);
      
      // Remove from source in BOTH arrays
      this.originalColumns.forEach(column => {
        const taskIndex = column.tasks.findIndex(t => t.id === task.id);
        if (taskIndex > -1) {
          column.tasks.splice(taskIndex, 1);
          console.log('🔵 Removed from original column:', column.title);
        }
      });
      
      this.columns.forEach(column => {
        const taskIndex = column.tasks.findIndex(t => t.id === task.id);
        if (taskIndex > -1) {
          column.tasks.splice(taskIndex, 1);
          console.log('🔵 Removed from display column:', column.title);
        }
      });

      // Find target column in BOTH arrays
      const targetDisplayColumn = this.columns.find(col => col.tasks === event.container.data);
      const targetOriginalColumn = this.originalColumns.find(col => col.id === targetDisplayColumn?.id);

      if (targetOriginalColumn && targetDisplayColumn) {
        // Update task status
        task.status = targetOriginalColumn.title as any;
        task.updatedAt = new Date();
        
        // Add to target in BOTH arrays
        targetOriginalColumn.tasks.splice(event.currentIndex, 0, { ...task });
        targetDisplayColumn.tasks.splice(event.currentIndex, 0, { ...task });

        const priorityIcon = this.getPriorityIcon(task.priority);
        this.showNotification(
          `${priorityIcon} Task moved to ${targetOriginalColumn.title}!`,
          'success'
        );
        
        console.log('✅ Task added to target column:', targetOriginalColumn.title);
        console.log('✅ Total tasks in target:', targetOriginalColumn.tasks.length);
      }

      this.saveTasksToStorage();
      this.cdr.detectChanges();
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  getColumnTitle(columnId: string): string {
    const column = this.originalColumns.find(col => col.id === columnId);
    const title = column ? column.title : 'TO DO';
    console.log('🔵 getColumnTitle:', columnId, '→', title);
    return title;
  }
}