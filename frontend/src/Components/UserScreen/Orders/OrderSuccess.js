// CVPetShop/frontend/src/Components/UserScreen/Orders/OrderSuccess.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserDrawer from '../UserDrawer';  // Changed: went up 1 level then to UserDrawer
import Header from '../../layouts/Header';  // Changed: went up 2 levels then to layouts/Header

const ORDER_COLORS = {
  background: '#03152f',
  panel: '#0a2348',
  accent: '#1f5ea6',
  accentSoft: '#d9e8ff',
  text: '#e6f0ff',
  mutedText: '#9ab4d3',
  border: '#1d4f88',
  success: '#63cf99',
};

export default function OrderSuccess({ route, navigation }) {
  const { order, orderId, orderNumber } = route.params || {};

  return (
    <UserDrawer>
      <SafeAreaView style={styles.safeArea}>
        <Header />
        
        <View style={styles.container}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={100} color={ORDER_COLORS.success} />
          </View>
          
          <Text style={styles.title}>Order Placed Successfully!</Text>
          <Text style={styles.subtitle}>
            Thank you for your purchase. Your order has been received.
          </Text>
          
          <View style={styles.orderInfo}>
            <Text style={styles.orderInfoText}>
              Order ID: {orderId || order?._id || 'N/A'}
            </Text>
            {orderNumber && (
              <Text style={styles.orderInfoText}>
                Order Number: {orderNumber}
              </Text>
            )}
            <Text style={styles.orderInfoText}>
              Total: ₱{order?.totalPrice?.toFixed(2) || '0.00'}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate('Home')}
            >
              <Icon name="home" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('OrderHistory')}
            >
              <Icon name="history" size={20} color={ORDER_COLORS.accent} />
              <Text style={styles.secondaryButtonText}>View Order History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </UserDrawer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ORDER_COLORS.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ORDER_COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: ORDER_COLORS.mutedText,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  orderInfo: {
    backgroundColor: ORDER_COLORS.panel,
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: ORDER_COLORS.border,
  },
  orderInfoText: {
    fontSize: 14,
    color: ORDER_COLORS.text,
    marginBottom: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: ORDER_COLORS.accent,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: ORDER_COLORS.panel,
    borderWidth: 1,
    borderColor: ORDER_COLORS.border,
  },
  secondaryButtonText: {
    color: ORDER_COLORS.accentSoft,
    fontSize: 16,
    fontWeight: '600',
  },
});