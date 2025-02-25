import type { TaskComment } from './partner';
import type { IconName } from './category';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          created_at: string
          last_login: string | null
          preferences: Json
          partner_id: string | null
          theme_preference: string
          notification_settings: Json
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          icon: IconName | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Row']>
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          completed: boolean
          due_date: string | null
          due_time: string | null
          priority: 'low' | 'medium' | 'high' | null
          category: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
          completed_on_time: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          due_time?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          due_time?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['comments']['Row']>
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          date: string
          tasks_completed: number
          tasks_overdue: number
          productivity_score: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['analytics']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['analytics']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          type: string | null
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]

export interface Task extends Database['public']['Tables']['tasks']['Row'] {
  requires_partner_approval?: boolean;
  partner_approved?: boolean | null;
  partner_id?: string | null;
  comments?: TaskComment[];
  partner?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
} 