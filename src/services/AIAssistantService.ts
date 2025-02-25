import { Platform } from 'react-native';
import * as Constants from 'expo-constants';
import { store } from '../store';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const OPEN_AI_API_URL = 'https://api.openai.com/v1/chat/completions';

export function getTaskContextForAI(): string {
  const state = store.getState();
  const tasks = state.tasks.tasks;
  const categories = state.categories.categories;
  
  let contextString = "Here's your current task information:\n\n";
  
  // Add task count summaries with priorities
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
  const dueSoonTasks = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    return dueDate <= threeDaysFromNow;
  });
  
  contextString += `Summary:
- Total tasks: ${tasks.length}
- Completed: ${completedTasks.length}
- Pending: ${pendingTasks.length}
- High priority: ${highPriorityTasks.length}
- Due within 3 days: ${dueSoonTasks.length}\n\n`;
  
  // Add category breakdown
  contextString += "Tasks by category:\n";
  categories.forEach(category => {
    const tasksInCategory = tasks.filter(t => t.category === category.id);
    const pendingInCategory = tasksInCategory.filter(t => !t.completed);
    if (tasksInCategory.length > 0) {
      contextString += `- ${category.name}: ${pendingInCategory.length} pending / ${tasksInCategory.length} total\n`;
    }
  });
  
  // Add urgent tasks section
  if (highPriorityTasks.length > 0 || dueSoonTasks.length > 0) {
    contextString += "\nUrgent tasks:\n";
    
    // High priority tasks
    highPriorityTasks.forEach(task => {
      const category = categories.find(c => c.id === task.category);
      const dueDate = task.due_date ? ` (Due: ${task.due_date})` : '';
      contextString += `- [HIGH] ${task.title}${dueDate} ${category ? `(${category.name})` : ''}\n`;
    });
    
    // Due soon but not high priority
    dueSoonTasks
      .filter(t => t.priority !== 'high')
      .forEach(task => {
        const category = categories.find(c => c.id === task.category);
        contextString += `- [DUE SOON] ${task.title} (Due: ${task.due_date}) ${category ? `(${category.name})` : ''}\n`;
      });
  }
  
  // Add recent tasks section
  contextString += "\nRecent pending tasks:\n";
  pendingTasks
    .filter(t => !highPriorityTasks.includes(t) && !dueSoonTasks.includes(t))
    .slice(0, 5)
    .forEach(task => {
      const category = categories.find(c => c.id === task.category);
      const priority = task.priority ? ` [${task.priority.toUpperCase()}]` : '';
      const dueDate = task.due_date ? ` (Due: ${task.due_date})` : '';
      contextString += `- ${task.title}${priority}${dueDate} ${category ? `(${category.name})` : ''}\n`;
    });
  
  // Add analytics
  contextString += getTaskAnalytics();
  
  return contextString;
}

export function getEnhancedSystemPrompt(): string {
  return `You are an AI assistant for a productivity app. Your primary functions are:

1. Help the user manage their tasks 
2. Provide productivity advice based on task analytics
3. Help organize and prioritize work
4. Suggest improvements based on task patterns

You have access to detailed task analytics including completion rates, priority distribution, and overdue tasks. Use this information to:
- Suggest task reorganization when needed
- Recommend priority changes
- Help users improve their completion rates
- Provide specific advice for overdue tasks
- Guide users in better task management

You can perform these actions:
- Create tasks: Format your response with [[ACTION:create]]Task title (Category)
- Mark tasks complete: Format with [[ACTION:complete]]Task title
- Schedule tasks: Format with [[ACTION:schedule]]Task title||YYYY-MM-DD
- Set priority: Format with [[ACTION:priority]]Task title||high/medium/low
- Add description: Format with [[ACTION:describe]]Task title||Description text
- Set category: Format with [[ACTION:categorize]]Task title||Category name

Examples of helpful responses:
- When asked to add a task: "I'll add that for you! [[ACTION:create]]Buy groceries (Shopping)"
- When asked to complete a task: "Task marked complete! [[ACTION:complete]]Submit report"
- When asked to schedule a task: "I've scheduled that for tomorrow! [[ACTION:schedule]]Call mom||2023-07-25"
- When asked to prioritize: "I'll set that as high priority! [[ACTION:priority]]Project presentation||high"
- When asked to describe: "Adding description! [[ACTION:describe]]Team meeting||Discuss Q3 goals and metrics"
- When asked to categorize: "Moving to Work category! [[ACTION:categorize]]Project review||Work"

Be proactive in suggesting improvements based on the analytics provided. If you notice concerning patterns (like many overdue tasks or low completion rates), mention them and offer specific advice.

Be concise and friendly. Always offer to help with specific tasks when appropriate.`;
}

export async function getAIResponse(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  try {
    // Use enhanced system prompt
    const systemPrompt = getEnhancedSystemPrompt();
    const taskContext = getTaskContextForAI();
    const fullContext = `${systemPrompt}\n\n${taskContext}`;
    
    // Make sure we have a system message at the beginning
    if (messages.length === 0 || messages[0].role !== 'system') {
      messages = [{ role: 'system', content: fullContext }, ...messages];
    }

    const response = await fetch(OPEN_AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return `Sorry, I encountered an error trying to process your request. Please try again later.`;
  }
}

export function getOpenAIKey(): string | null {
  // First try directly from process.env for development
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  // Then check for Expo public variables
  if (process.env.EXPO_PUBLIC_OPENAI_ACCESS_KEY) {
    return process.env.EXPO_PUBLIC_OPENAI_ACCESS_KEY;
  }
  
  // Finally check Expo Constants for mobile
  try {
    const constantsManifest = Constants.default.expoConfig?.extra;
    if (constantsManifest?.openAIApiKey) {
      return constantsManifest.openAIApiKey;
    }
  } catch (e) {
    console.warn("Error accessing Expo Constants:", e);
  }
  
  return null;
}

export function getTaskAnalytics(): string {
  const state = store.getState();
  const tasks = state.tasks.tasks;
  const now = new Date();
  
  // Calculate completion rate
  const completedTasks = tasks.filter(t => t.completed);
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  // Calculate on-time completion rate
  const onTimeCompletions = completedTasks.filter(t => t.completed_on_time);
  const onTimeRate = completedTasks.length > 0
    ? Math.round((onTimeCompletions.length / completedTasks.length) * 100)
    : 0;

  // Analyze task priorities
  const pendingTasks = tasks.filter(t => !t.completed);
  const highPriority = pendingTasks.filter(t => t.priority === 'high').length;
  const mediumPriority = pendingTasks.filter(t => t.priority === 'medium').length;
  const lowPriority = pendingTasks.filter(t => t.priority === 'low').length;
  const noPriority = pendingTasks.filter(t => !t.priority).length;

  // Analyze overdue tasks
  const overdueTasks = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < now;
  });

  let analyticsString = `\nTask Analytics:
- Task completion rate: ${completionRate}%
- On-time completion rate: ${onTimeRate}%
- Priority distribution of pending tasks:
  • High: ${highPriority}
  • Medium: ${mediumPriority}
  • Low: ${lowPriority}
  • Unset: ${noPriority}
- Overdue tasks: ${overdueTasks.length}`;

  // Add productivity insights
  const insights = [];
  
  if (noPriority > 0) {
    insights.push(`• ${noPriority} tasks need priority assignment`);
  }
  
  if (overdueTasks.length > 0) {
    insights.push(`• ${overdueTasks.length} tasks are overdue and need attention`);
  }
  
  if (highPriority > 5) {
    insights.push("• Consider redistributing high priority tasks");
  }
  
  if (completionRate < 50) {
    insights.push("• Task completion rate is low, consider focusing on completing existing tasks");
  }
  
  if (onTimeRate < 70) {
    insights.push("• On-time completion rate could be improved");
  }

  if (insights.length > 0) {
    analyticsString += "\n\nInsights:\n" + insights.join("\n");
  }

  return analyticsString;
} 