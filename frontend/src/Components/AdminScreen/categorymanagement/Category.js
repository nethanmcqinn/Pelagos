import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AdminDrawer from '../AdminDrawer';
import { getToken } from '../../../utils/helper';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CategoryScreen() {
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${BACKEND_URL}/api/v1/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch categories');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async () => {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Category name is required');
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      await axios.post(
        `${BACKEND_URL}/api/v1/admin/categories`,
        { name: trimmed },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCategoryName('');
      await fetchCategories();
      Alert.alert('Success', 'Category saved to MongoDB');
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (category) => {
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              await axios.delete(`${BACKEND_URL}/api/v1/admin/categories/${category._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setCategories((prev) => prev.filter((item) => item._id !== category._id));
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { logout } = await import('../../../utils/helper');
          await logout();
        },
      },
    ]);
  };

  const renderCategory = ({ item }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCategory(item)}>
        <Icon name="delete" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <AdminDrawer onLogout={handleLogout}>
      <View style={styles.container}>
        <Text style={styles.title}>Category Management</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add new category"
            placeholderTextColor="#8da9c4"
            value={categoryName}
            onChangeText={setCategoryName}
            editable={!loading}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleCreateCategory} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Icon name="add" size={24} color="#fff" />}
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={renderCategory}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No categories found.</Text>}
        />
      </View>
    </AdminDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03152f',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e6f0ff',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#0a2348',
    borderWidth: 1,
    borderColor: '#12325f',
    color: '#e6f0ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#1f5ea6',
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryItem: {
    backgroundColor: '#0a2348',
    borderColor: '#12325f',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6f0ff',
  },
  deleteButton: {
    backgroundColor: '#b94040',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyText: {
    color: '#8da9c4',
    textAlign: 'center',
    marginTop: 20,
  },
});
