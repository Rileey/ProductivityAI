import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconNames = keyof typeof MaterialCommunityIcons.glyphMap;

export const icons = {
  // Analytics icons
  trendingUp: 'trending-up' as IconNames,
  trendingDown: 'trending-down' as IconNames,
  trendingNeutral: 'trending-neutral' as IconNames,
  clockAlert: 'clock-alert' as IconNames,
  calendarToday: 'calendar-today' as IconNames,
  calendarCheck: 'calendar-check' as IconNames,
  chevronDown: 'chevron-down' as IconNames,
  flag: 'flag' as IconNames,
  folderOutline: 'folder-outline' as IconNames,
  flagOutline: 'flag-outline' as IconNames,
  calendarOutline: 'calendar-outline' as IconNames,
  filter: 'filter' as IconNames,
  close: 'close' as IconNames,
  checkCircle: 'check-circle' as IconNames,
  clockOutline: 'clock-outline' as IconNames,
  folder: 'folder' as IconNames,
} as const;

export type IconName = typeof icons[keyof typeof icons]; 