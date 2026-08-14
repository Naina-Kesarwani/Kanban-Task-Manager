// src/app/models/task.model.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'TO DO' | 'IN PROGRESS' | 'COMPLETED';
  startDate?: string; // Added for task start date/time
  endDate?: string;   // Added for task end date/time
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
  timeSpent: number; // in seconds
  isTimerRunning: boolean;
  timerStartTime?: number; // timestamp when timer started
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}