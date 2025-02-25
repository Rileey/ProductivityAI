import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconNames = keyof typeof MaterialCommunityIcons.glyphMap;

export const icons = {
  // Navigation icons
  home: 'home' as IconNames,
  settings: 'cog' as IconNames,
  analytics: 'chart-box' as IconNames,
  categories: 'folder' as IconNames,

  // Task icons
  add: 'plus' as IconNames,
  edit: 'pencil' as IconNames,
  delete: 'delete' as IconNames,
  close: 'close' as IconNames,
  check: 'check' as IconNames,
  checkCircle: 'check-circle' as IconNames,
  clockOutline: 'clock-outline' as IconNames,
  bellOutline: 'bell-outline' as IconNames,

  // Status icons
  clockAlert: 'clock-alert' as IconNames,
  calendarToday: 'calendar-today' as IconNames,
  calendarCheck: 'calendar-check' as IconNames,
  calendarOutline: 'calendar-outline' as IconNames,

  // Priority icons
  flag: 'flag' as IconNames,
  flagOutline: 'flag-outline' as IconNames,

  // Trend icons
  trendingUp: 'trending-up' as IconNames,
  trendingDown: 'trending-down' as IconNames,
  trendingNeutral: 'trending-neutral' as IconNames,

  // Filter icons
  filter: 'filter' as IconNames,
  chevronDown: 'chevron-down' as IconNames,
  folder: 'folder' as IconNames,
  folderOutline: 'folder-outline' as IconNames,
  chevronUp: 'chevron-up' as IconNames,

  // Add new icons
  clockCheck: 'clock-check' as IconNames,
} as const;

export type IconName = typeof icons[keyof typeof icons]; 