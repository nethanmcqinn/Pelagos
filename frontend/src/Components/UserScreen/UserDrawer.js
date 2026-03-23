// C&V PetShop/frontend/src/Components/UserScreen/UserDrawer.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUser, logout } from '../../utils/helper';

const DRAWER_COLORS = {
  base: '#03152f',
  panel: '#0a2348',
  panelAlt: '#0d2d5c',
  accent: '#2f74c0',
  accentStrong: '#1f5ea6',
  cartBlue: '#0f4c97',
  accentSoft: '#d9e8ff',
  text: '#e6f0ff',
  mutedText: '#9ab4d3',
  border: '#1d4f88',
  danger: '#ff8a8a',
};

const UserDrawer = ({ children }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Update active tab based on current route
  useEffect(() => {
    if (route.name === 'Home' || route.name === 'Cart' || route.name === 'Profile' || route.name === 'OrderHistory') {
      if (route.name === 'Profile') {
        setActiveTab('Home');
      } else if (route.name === 'OrderHistory') {
        setActiveTab('Orders');
      } else {
        setActiveTab(route.name);
      }
    }
  }, [route.name]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDrawer = useCallback(() => {
    setDrawerVisible(true);
    loadUserData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    navigation.setParams({ openUserDrawer: showDrawer });
  }, [navigation, showDrawer]);

  const hideDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      setUser(null);
    });
  }, [fadeAnim, slideAnim]);

  const handleLogout = useCallback(async () => {
    hideDrawer();
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await logout();
              navigation.getParent()?.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
          style: "destructive"
        }
      ]
    );
  }, [hideDrawer, navigation]);

  const handleNavigation = useCallback((screenName) => {
    hideDrawer();

    // Handle Orders navigation to OrderHistory
    if (screenName === 'Orders') {
      setActiveTab('Orders');
      navigation.navigate('OrderHistory');
      return;
    }

    // Cart and all other registered screens navigate normally
    setActiveTab(screenName === 'Profile' ? 'Home' : screenName);

    try {
      navigation.navigate(screenName);
    } catch (error) {
      console.log(`Navigation to ${screenName} failed:`, error);
      Alert.alert('Error', `Cannot navigate to ${screenName}`);
    }
  }, [hideDrawer, navigation]);

  const drawerItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      activeIcon: 'person',
      color: DRAWER_COLORS.accentStrong,
      screen: 'Profile'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'log-out-outline',
      activeIcon: 'log-out',
      color: DRAWER_COLORS.danger,
      isLogout: true
    },
  ];

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
      screen: 'Home'
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: 'cart-outline',
      activeIcon: 'cart',
      screen: 'Cart'
    },
    {
      id: 'orders',
      label: 'My Orders',
      icon: 'receipt-outline',
      activeIcon: 'receipt',
      screen: 'Orders'
    },
  ];

  const renderTab = useCallback((tab) => {
    const isActive = activeTab === tab.screen;
    const isMenuTab = tab.isMenu;
    const tabColor = tab.screen === 'Cart'
      ? DRAWER_COLORS.cartBlue
      : (isActive ? DRAWER_COLORS.accent : DRAWER_COLORS.mutedText);

    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabItem}
        onPress={() => isMenuTab ? showDrawer() : handleNavigation(tab.screen)}
        activeOpacity={0.7}
        accessibilityLabel={`${tab.label} tab`}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={isActive ? tab.activeIcon : tab.icon}
            size={24}
            color={tabColor}
          />
        </View>
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel, tab.screen === 'Cart' && styles.cartTabLabel]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  }, [activeTab, showDrawer, handleNavigation]);

  const renderDrawerItem = useCallback((item) => {
    const handlePress = () => {
      if (item.isLogout) {
        handleLogout();
      } else {
        handleNavigation(item.screen);
      }
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.drawerItem}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.drawerIconContainer, { backgroundColor: `${item.color}15` }]}>
          <Ionicons
            name={item.icon}
            size={22}
            color={item.color}
          />
        </View>
        <Text style={[styles.drawerItemText, { color: item.color }]}>
          {item.label}
        </Text>
        {!item.isLogout && (
          <Ionicons name="chevron-forward" size={18} color="#8da9c4" />
        )}
      </TouchableOpacity>
    );
  }, [handleNavigation, handleLogout]);

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={DRAWER_COLORS.base} barStyle="light-content" />
      
      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.childContent}>
          {children}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            {tabs.map(renderTab)}
          </View>
        </View>
      </View>

      {/* Drawer Modal */}
      <Modal
        transparent={true}
        visible={drawerVisible}
        onRequestClose={hideDrawer}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={hideDrawer}>
          <Animated.View style={[styles.drawerOverlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.drawerContainer,
                  { transform: [{ translateX: slideAnim }] }
                ]}
              >
                {/* Drawer Header */}
                <View style={styles.drawerHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      {loading ? (
                        <Text style={styles.avatarText}>...</Text>
                      ) : (
                        <Text style={styles.avatarText}>{getUserInitials()}</Text>
                      )}
                    </View>
                    <View style={styles.userDetails}>
                      {loading ? (
                        <>
                          <Text style={styles.userName}>Loading...</Text>
                          <Text style={styles.userEmail}>Please wait</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.userName}>{user?.name || 'User'}</Text>
                          <Text style={styles.userEmail}>{user?.email || 'user@email.com'}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={hideDrawer} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={DRAWER_COLORS.mutedText} />
                  </TouchableOpacity>
                </View>

                {/* Drawer Items */}
                <View style={styles.drawerItems}>
                  {drawerItems.map(renderDrawerItem)}
                </View>

                {/* Drawer Footer */}
                <View style={styles.drawerFooter}>
                  <Text style={styles.appVersion}>Pelagos v1.0.0</Text>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DRAWER_COLORS.base,
  },
  content: {
    flex: 1,
    backgroundColor: DRAWER_COLORS.base,
  },
  childContent: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: DRAWER_COLORS.panel,
    borderTopWidth: 1,
    borderTopColor: DRAWER_COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    color: DRAWER_COLORS.mutedText,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: DRAWER_COLORS.accent,
    fontWeight: '600',
  },
  cartTabLabel: {
    color: DRAWER_COLORS.cartBlue,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: DRAWER_COLORS.panel,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: DRAWER_COLORS.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: DRAWER_COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: DRAWER_COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: DRAWER_COLORS.mutedText,
  },
  closeButton: {
    padding: 4,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: DRAWER_COLORS.border,
  },
  drawerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  drawerItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: DRAWER_COLORS.border,
  },
  appVersion: {
    fontSize: 12,
    color: DRAWER_COLORS.mutedText,
    textAlign: 'center',
  },
});

export default UserDrawer;