// C&V PetShop/frontend/src/Components/Navigation/AppNavigator.js
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthenticationStack from './AuthenticationStack';
import UserStack from './UserStack';
import AdminStack from './AdminStack';
import OrderNotification from '../UserScreen/Notification/OrderNotification';
import OrderDetails from '../UserScreen/Orders/OrderDetails';
import { getUser, onAuthChange } from '../../utils/helper';
import { navigationTheme, uiColors } from '../../theme/uiTheme';

const Stack = createNativeStackNavigator();

// Use forwardRef to expose navigation methods to parent (App.js)
const AppNavigator = forwardRef((props, ref) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigationRef, setNavigationRef] = useState(null);

  // Expose navigation methods to parent component
  useImperativeHandle(ref, () => ({
    navigate: (name, params) => {
      if (navigationRef) {
        navigationRef.navigate(name, params);
      }
    },
    getCurrentRoute: () => {
      if (navigationRef) {
        return navigationRef.getCurrentRoute();
      }
      return null;
    }
  }));

  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      try {
        const currentUser = await getUser();
        if (isMounted) {
          console.log('Initial user loaded:', currentUser);
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadUser();

    // Listen for authentication changes
    const unsubscribe = onAuthChange((updatedUser) => {
      console.log('Auth state changed:', updatedUser);
      if (isMounted) {
        setUser(updatedUser);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Function to render the appropriate stack based on user role
  const renderMainStack = () => {
    if (!user) {
      return <AuthenticationStack />;
    }
    return user.role === 'admin' ? <AdminStack /> : <UserStack />;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={uiColors.accent} />
      </View>
    );
  }

  console.log('AppNavigator rendering with user:', user);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        ref={setNavigationRef}
        theme={navigationTheme}
        onReady={() => {
          console.log('Navigation container is ready');
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: uiColors.background },
          }}
        >
          {/* Main stack based on authentication - FIXED: Use component prop */}
          <Stack.Screen 
            name="MainApp" 
            component={renderMainStack}
          />
          
          {/* Global screens that can be accessed from anywhere */}
          <Stack.Screen 
            name="OrderNotification" // CHANGED: Match the name used in App.js
            component={OrderNotification}
            options={{ 
              headerShown: true,
              title: 'Notifications',
              headerBackTitle: 'Back',
              headerTintColor: uiColors.text,
              headerStyle: { backgroundColor: uiColors.surface },
            }}
          />
          
          <Stack.Screen 
            name="OrderDetails" 
            component={OrderDetails}
            options={{ 
              headerShown: true,
              title: 'Order Details',
              headerBackTitle: 'Back',
              headerTintColor: uiColors.text,
              headerStyle: { backgroundColor: uiColors.surface },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: uiColors.background,
  },
});

export default AppNavigator;