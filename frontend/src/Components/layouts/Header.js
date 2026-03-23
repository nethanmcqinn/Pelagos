// CVPetshop/frontend/src/Components/layouts/Header.js
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { pixelFontFamily, uiColors } from '../../theme/uiTheme';

const { width } = Dimensions.get('window');

const Header = () => {
  const route = useRoute();
  const onMenuPress = route?.params?.openUserDrawer;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.navContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => onMenuPress && onMenuPress()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={24} color={uiColors.text} />
          </TouchableOpacity>

          <View style={styles.navLogo}>
            <Image 
              source={require('./logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.shopName}>Pelagos</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: uiColors.surface,
  },
  header: {
    width: '100%',
    backgroundColor: uiColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    top: 0,
    zIndex: 1000,
  },
  navContainer: {
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    left: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#0a2348',
  },
  navLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0a2348',
    padding: 5,
  },
  shopName: {
    fontSize: 24,
    color: uiColors.text,
    fontFamily: pixelFontFamily,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
});

export default Header;