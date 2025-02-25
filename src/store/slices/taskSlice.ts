import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';
import type { Database } from '../../types/database';
import { retryOperation } from '../../utils/api';
import { PayloadAction } from '@reduxjs/toolkit';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  lastSync: string | null;
  operations: {
    adding: boolean;
    updating: boolean;
    deleting: boolean;
    toggling: boolean;
  };
  operationErrors: {
    [key: string]: string | null;
  };
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  lastSync: null,
  operations: {
    adding: false,
    updating: false,
    deleting: false,
    toggling: false,
  },
  operationErrors: {},
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await retryOperation(async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) throw new Error('No data received');
        return data;
      });
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

export const addTask = createAsyncThunk(
  'tasks/add',
  async (task: Partial<Task>, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          user_id: user.id,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error adding task:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const toggleTaskStatus = createAsyncThunk(
  'tasks/toggleStatus',
  async (task: Task, { rejectWithValue }) => {
    try {
      const now = new Date();
      const dueDate = task.due_date ? new Date(`${task.due_date}T${task.due_time || '23:59:59'}`) : null;
      const completedOnTime = dueDate ? now <= dueDate : null;

      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? now.toISOString() : null,
          completed_on_time: !task.completed ? completedOnTime : null,
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await retryOperation(async () => {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);

        if (error) throw error;
      });
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete task');
    }
  }
);

export const editTask = createAsyncThunk(
  'tasks/editTask',
  async ({ taskId, updates }: {
    taskId: string,
    updates: Partial<Task>
  }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.operationErrors = {};
    },
    clearOperationError: (state, action: PayloadAction<string>) => {
      state.operationErrors[action.payload] = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addTask.pending, (state) => {
        state.operations.adding = true;
        state.operationErrors['add'] = null;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.operations.adding = false;
        state.tasks.push(action.payload);
        state.error = null;
      })
      .addCase(addTask.rejected, (state, action) => {
        state.operations.adding = false;
        state.error = action.payload as string;
      })
      .addCase(toggleTaskStatus.pending, (state) => {
        state.operations.toggling = true;
        state.operationErrors['toggle'] = null;
      })
      .addCase(toggleTaskStatus.fulfilled, (state, action) => {
        state.operations.toggling = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(toggleTaskStatus.rejected, (state, action) => {
        state.operations.toggling = false;
        state.operationErrors['toggle'] = action.payload as string;
      })
      .addCase(deleteTask.pending, (state) => {
        state.operations.deleting = true;
        state.operationErrors['delete'] = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.operations.deleting = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.operations.deleting = false;
        state.operationErrors['delete'] = action.payload as string;
      })
      .addCase(editTask.pending, (state) => {
        state.operations.updating = true;
        state.operationErrors['edit'] = null;
      })
      .addCase(editTask.fulfilled, (state, action) => {
        state.operations.updating = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(editTask.rejected, (state, action) => {
        state.operations.updating = false;
        state.operationErrors['edit'] = action.payload as string;
      });
  }
});

export const { clearError, clearOperationError } = taskSlice.actions;
export default taskSlice.reducer; 