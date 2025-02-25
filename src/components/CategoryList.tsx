import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, IconButton, Menu, useTheme as usePaperTheme } from 'react-native-paper';
import { Database } from '../types/database';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryListProps {
  categories: Category[];
  onDeleteCategory: (id: string) => void;
  onSelectCategory?: (category: Category | null) => void;
  selectedCategoryId?: string | null;
}

export default function CategoryList({ 
  categories, 
  onDeleteCategory, 
  onSelectCategory,
  selectedCategoryId 
}: CategoryListProps) {
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const paperTheme = usePaperTheme();

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {onSelectCategory && (
        <List.Item
          title="All Categories"
          left={props => (
            <List.Icon 
              {...props} 
              icon="folder" 
              color={paperTheme.colors.primary}
            />
          )}
          onPress={() => onSelectCategory(null)}
          style={[
            styles.item,
            !selectedCategoryId && { backgroundColor: paperTheme.colors.primaryContainer }
          ]}
        />
      )}
      
      {categories.map(category => (
        <List.Item
          key={category.id}
          title={category.name}
          titleStyle={{ color: paperTheme.colors.onSurface }}
          left={props => (
            <List.Icon 
              {...props} 
              icon={category.icon || 'folder'} 
              color={category.color || paperTheme.colors.primary}
            />
          )}
          right={props => (
            <Menu
              visible={menuVisible === category.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  {...props}
                  icon="dots-vertical"
                  iconColor={paperTheme.colors.onSurface}
                  onPress={() => setMenuVisible(category.id)}
                />
              }
            >
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(null);
                  onDeleteCategory(category.id);
                }} 
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          )}
          onPress={() => onSelectCategory?.(category)}
          style={[
            styles.item,
            selectedCategoryId === category.id && { 
              backgroundColor: paperTheme.colors.primaryContainer 
            }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 4,
  },
}); 