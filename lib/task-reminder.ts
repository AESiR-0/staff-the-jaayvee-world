import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  assignedTo: string | null;
  deadline: string | null;
  createdAt: string;
}

export interface TaskReminder {
  task: Task;
  timeUntilDeadline: number; // minutes
  isUrgent: boolean; // true if less than 1 hour remaining
}

export async function fetchTasksForReminders(): Promise<Task[]> {
  try {
    // Tasks API is on the main site (jaayvee-world), same as notifications
    // Use API_BASE_URL from lib/api.ts but fallback to main site (not talaash)
    // For local dev: Set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 in .env.local
    const baseUrl = API_BASE_URL || 'https://thejaayveeworld.com';
    
    const response = await authenticatedFetch(`${baseUrl}/api/team/tasks`);

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }

    const result = await response.json();
    if (result.success) {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching tasks for reminders:', error);
    return [];
  }
}

export function getTaskReminders(tasks: Task[]): TaskReminder[] {
  const now = new Date();
  const reminders: TaskReminder[] = [];

  tasks.forEach(task => {
    // Only check tasks that are not completed and have a deadline
    if (task.status !== 'completed' && task.deadline) {
      const deadline = new Date(task.deadline);
      const timeUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60)); // minutes
      
      // Show reminder if deadline is within 24 hours
      if (timeUntilDeadline > 0 && timeUntilDeadline <= 24 * 60) {
        reminders.push({
          task,
          timeUntilDeadline,
          isUrgent: timeUntilDeadline <= 60, // Urgent if less than 1 hour
        });
      }
    }
  });

  // Sort by urgency (urgent first, then by time remaining)
  return reminders.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return a.timeUntilDeadline - b.timeUntilDeadline;
  });
}

export function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} day${days !== 1 ? 's' : ''}`;
}


