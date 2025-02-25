import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface CategoryWithStats {
  category: string;
  total: number;
  completed: number;
  completionRate: number;
  icon: IconName;
  color?: string;
}

export interface Category extends Database['public']['Tables']['categories']['Row'] {
  icon: IconName | null;
} 