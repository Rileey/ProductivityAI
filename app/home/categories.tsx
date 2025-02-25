import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../src/contexts/AuthContext';
import CategoryList from '../../src/components/CategoryList';
import CategoryModal from '../../src/components/CategoryModal';
import { AppDispatch, RootState } from '../../src/store';
import { fetchCategories, addCategory, deleteCategory } from '../../src/store/slices/categorySlice';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function Categories() {
  const dispatch = useDispatch<AppDispatch>();
  const { session } = useAuth();
  const { categories, loading } = useSelector((state: RootState) => state.categories);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (session?.user.id) {
      dispatch(fetchCategories(session.user.id));
    }
  }, [dispatch, session]);

  const handleAddCategory = async (data: { name: string; color: string; icon: string }) => {
    if (!session?.user.id) return;
    await dispatch(addCategory({ ...data, userId: session.user.id }));
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await dispatch(deleteCategory(categoryId));
  };

  if (loading && categories.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <CategoryList
        categories={categories}
        onDeleteCategory={handleDeleteCategory}
      />
      
      <CategoryModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        onSave={handleAddCategory}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 