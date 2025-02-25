// Add or update this function to ensure specific categories have appropriate icons
export function getCategoryStyle(categoryName) {
  const defaultStyle = { color: '#9E9E9E', icon: 'folder-outline' };
  
  if (!categoryName) return defaultStyle;
  
  const categoryStyles = {
    'Chores': { color: '#FFA000', icon: 'broom' },
    'Work': { color: '#F44336', icon: 'briefcase' },
    'Parents': { color: '#2196F3', icon: 'account-group' },
    'Personal': { color: '#4CAF50', icon: 'account' },
    'Health': { color: '#E91E63', icon: 'heart' },
    'Education': { color: '#9C27B0', icon: 'school' },
    'Finance': { color: '#009688', icon: 'cash' },
    'Shopping': { color: '#FF5722', icon: 'cart' },
    'Social': { color: '#3F51B5', icon: 'account-multiple' },
    'Travel': { color: '#795548', icon: 'airplane' }
  };
  
  return categoryStyles[categoryName] || defaultStyle;
} 