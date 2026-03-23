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
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(bubbleRiseRight, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [bubbleRiseLeft, bubbleRiseRight, fishDrift]);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const apiUrl = `${BACKEND_URL}/api/v1/users/register`;
      console.log('Calling API:', apiUrl);
      
      const res = await axios.post(apiUrl, { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      console.log('✅ Registration successful:', res.data);
      
      Alert.alert(
        'Success', 
        'Registration successful! Please check your email for verification.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
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
              outputRange: [0.1, 0.48, 0],
            }),
            transform: [
              {
                translateY: bubbleRiseLeft.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -300],
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
              outputRange: [0.1, 0.44, 0],
            }),
            transform: [
              {
                translateY: bubbleRiseRight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -340],
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
                  outputRange: [-12, 12],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="set-meal" size={26} color="#b8e0ff" />
      </Animated.View>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={24} color="#d4ecff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Logo or Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Icon name="set-meal" size={24} color="#9ad1ff" style={styles.fishIconSmall} />
              <Icon name="person-add" size={34} color="#d4ecff" />
              <Icon name="set-meal" size={18} color="#6bb8ff" style={styles.fishIconTiny} />
            </View>
            <Text style={styles.tagline}>Fresh from the ocean to your plate</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <Icon name="person" size={20} color="#9ad1ff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  style={styles.input}
                  placeholderTextColor="#8da9c4"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Icon name="email" size={20} color="#9ad1ff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  placeholderTextColor="#8da9c4"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Icon name="lock" size={20} color="#9ad1ff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Create a password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
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
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <Text style={styles.hintText}>Minimum 6 characters</Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Icon name="lock" size={20} color="#9ad1ff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                  }}
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.input, { flex: 1 }]}
                  placeholderTextColor="#8da9c4"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon 
                    name={showConfirmPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color="#9ad1ff" 
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Icon name="info-outline" size={16} color="#8da9c4" />
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
    top: -110,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0f2f5a',
  },
  oceanGlowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#0a2850',
  },
  floatingFish: {
    position: 'absolute',
    top: 84,
    left: 34,
    opacity: 0.72,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#9ad1ff',
  },
  bubbleLeft: {
    width: 12,
    height: 12,
    left: 24,
    bottom: 80,
  },
  bubbleRight: {
    width: 9,
    height: 9,
    right: 28,
    bottom: 65,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e6f0ff',
  },
  placeholder: {
    width: 34,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#13315c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f4e79',
  },
  fishIconSmall: {
    position: 'absolute',
    top: 10,
    left: 12,
  },
  fishIconTiny: {
    position: 'absolute',
    right: 10,
    bottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#8da9c4',
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
  inputWrapper: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4ecff',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f4e79',
    borderRadius: 10,
    paddingHorizontal: 12,
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
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  hintText: {
    color: '#8da9c4',
    fontSize: 11,
    marginTop: 3,
    marginLeft: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102f57',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1f4e79',
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#8da9c4',
    lineHeight: 18,
  },
  termsLink: {
    color: '#9ad1ff',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#134074',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#6bb8ff',
  },
  registerButtonText: {
    color: '#e6f0ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#8da9c4',
  },
  loginLink: {
    fontSize: 14,
    color: '#9ad1ff',
    fontWeight: 'bold',
  },
});