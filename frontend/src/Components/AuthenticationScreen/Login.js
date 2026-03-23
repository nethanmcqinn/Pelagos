import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import { authenticate } from '../../utils/helper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { registerForPushNotificationsAsync } from '../../hooks/usePushNotifications';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fishDrift = useRef(new Animated.Value(0)).current;
  const bubbleRiseLeft = useRef(new Animated.Value(0)).current;
  const bubbleRiseRight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fishDrift, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fishDrift, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(bubbleRiseLeft, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(bubbleRiseRight, {
        toValue: 1,
        duration: 3400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [bubbleRiseLeft, bubbleRiseRight, fishDrift]);
// Update the handleLogin function in your Login.js
// Update your handleLogin function
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }

  setLoading(true);
  try {
    const apiUrl = `${BACKEND_URL}/api/v1/users/login`;
    console.log('Calling API:', apiUrl);
    
    const res = await axios.post(apiUrl, { email, password });
    
    console.log('✅ Login successful:', res.data);
    
    // Save token and user info
    await authenticate(res.data, async () => {
      Alert.alert('Success', 'Login successful');
      
      // Register for push notifications after successful login
      // Add a small delay to ensure authentication is complete
    setTimeout(async () => {
      console.log('Attempting to register push token after login...');
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        console.log('✅ Push token registered successfully:', token);
      } else {
        console.log('⚠️ Push token registration returned null');
      }
    }, 1000);
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    Alert.alert('Login Failed', error.response?.data?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.oceanGlowTop} />
      <View style={styles.oceanGlowBottom} />
      <Animated.View
        style={[
          styles.bubble,
          styles.bubbleLeft,
          {
            opacity: bubbleRiseLeft.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0.1, 0.5, 0],
            }),
            transform: [
              {
                translateY: bubbleRiseLeft.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -280],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          styles.bubbleRight,
          {
            opacity: bubbleRiseRight.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0.1, 0.45, 0],
            }),
            transform: [
              {
                translateY: bubbleRiseRight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -320],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingFish,
          {
            transform: [
              {
                translateX: fishDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-14, 14],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="set-meal" size={28} color="#b8e0ff" />
      </Animated.View>
      <View style={styles.content}>
        {/* Logo or App Name */}
        <View style={styles.logoContainer}>
          <View style={styles.fishBadgeRow}>
            <Icon name="set-meal" size={26} color="#9ad1ff" />
            <Icon name="set-meal" size={34} color="#d4ecff" />
            <Icon name="set-meal" size={20} color="#6bb8ff" />
          </View>
          <Icon name="set-meal" size={70} color="#d4ecff" />
          <Text style={styles.appName}>Pelagos</Text>
          <Text style={styles.tagline}>Fresh from the ocean to your plate</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#9ad1ff" style={styles.inputIcon} />
            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor="#8da9c4"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#9ad1ff" style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#8da9c4"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#9ad1ff" 
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>By signing in, you agree to our</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> and </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04162d',
  },
  oceanGlowTop: {
    position: 'absolute',
    top: -120,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0f2f5a',
  },
  oceanGlowBottom: {
    position: 'absolute',
    bottom: -140,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#0a2850',
  },
  floatingFish: {
    position: 'absolute',
    top: 120,
    right: 42,
    opacity: 0.75,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#9ad1ff',
  },
  bubbleLeft: {
    width: 14,
    height: 14,
    left: 30,
    bottom: 70,
  },
  bubbleRight: {
    width: 10,
    height: 10,
    right: 26,
    bottom: 50,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  fishBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e6f0ff',
    marginTop: 10,
  },
  tagline: {
    fontSize: 14,
    color: '#8da9c4',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#0b2545',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#00152e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#1f4e79',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e6f0ff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8da9c4',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f4e79',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: '#13315c',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#e6f0ff',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#9ad1ff',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#134074',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#6bb8ff',
  },
  loginButtonText: {
    color: '#e6f0ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#8da9c4',
  },
  signUpLink: {
    fontSize: 14,
    color: '#9ad1ff',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8da9c4',
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    marginTop: 5,
  },
  footerLink: {
    fontSize: 12,
    color: '#9ad1ff',
    fontWeight: '500',
  },
});