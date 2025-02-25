// First, let's create a new file for category colors
interface CategoryStyle {
  color: string;
  icon: string;
  lightColor: string;
}

export const CATEGORY_STYLES: Record<CategoryName, CategoryStyle> = {
  'Chores': {
    color: '#FFA000',
    icon: 'broom',
    lightColor: '#FFF3E0',
  },
  'Parents': {
    color: '#2196F3',
    icon: 'account-group',
    lightColor: '#E3F2FD',
  },
  'Work': {
    color: '#F44336',
    icon: 'briefcase',
    lightColor: '#FFEBEE',
  },
  'default': {
    color: '#9E9E9E',
    icon: 'folder-outline',
    lightColor: '#F5F5F5',
  },
} as const;

export type CategoryName = keyof typeof CATEGORY_STYLES;

export function getCategoryStyle(categoryName: string | null): CategoryStyle {
  if (!categoryName) return CATEGORY_STYLES.default;
  return CATEGORY_STYLES[categoryName as CategoryName] || CATEGORY_STYLES.default;
}

export function getCategoryColor(categoryName: string | null): string {
  return getCategoryStyle(categoryName).color;
} 