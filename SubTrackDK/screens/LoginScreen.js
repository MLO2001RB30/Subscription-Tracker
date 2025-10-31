import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import Colors from '../constants/Colors';
import api from '../services/api'; // Import your API service
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useNavigation } from "@react-navigation/native";
import { login } from "../api/api";

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Indtast venligst email og adgangskode");
      return;
    }

    try {
      setError(''); // Clear any previous errors
      console.log('Attempting login with:', email);
      
      await login(email, password);
      console.log('Login successful, navigating to MainApp');
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        })
      );
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError("Forkert email eller adgangskode");
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        setError("Kan ikke forbinde til serveren");
      } else {
        setError("Login fejlede. Prøv igen.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.outerContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={30} color={Colors.darkPurple} />
      </TouchableOpacity>
      {/* Flying objects in background */}
      <Image source={require('../assets/star_icon.png')} style={styles.starIcon1} />
      <Image source={require('../assets/empty_circle_icon.png')} style={styles.emptyCircleIcon1} />
      <Image source={require('../assets/empty_gray_circle_icon.png')} style={styles.emptyGrayCircleIcon1} />
      <Image source={require('../assets/filled_circle_icon.png')} style={styles.filledCircleIcon1} />
      <Image source={require('../assets/gray_star_icon.png')} style={styles.grayStarIcon1} />

      <Image
        source={require('../assets/login_illustration.png')}
        style={styles.illustration}
        onError={(e) => console.log('Login Illustration Load Error:', e.nativeEvent.error)}
      />

      <Text style={styles.title}>Log ind</Text>

        <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.lightText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.lightText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

      <TouchableOpacity onPress={() => console.log('Forgot password pressed')} style={styles.forgotPasswordButton}>
        <Text style={styles.forgotPasswordText}>Glemt kodeord?</Text>
      </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.signupButton} onPress={handleLogin}>
        <Text style={styles.signupButtonText}>Log ind</Text>
        </TouchableOpacity>

      {/* Test button for navigation without backend */}
      <TouchableOpacity 
        style={[styles.signupButton, { backgroundColor: '#28a745', bottom: 130, right: 40 }]} 
        onPress={() => {
          console.log('Test navigation to MainApp');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainApp' }],
            })
          );
        }}
      >
        <Text style={styles.signupButtonText}>Test Login</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative',
    paddingTop: 100,
  },
  // cardContainer removed
  // Styles for flying objects (randomized positions and higher zIndex)
  starIcon1: {
    position: 'absolute',
    top: 200, // Moved lower
    left: 40, // Adjusted
    width: 25,
    height: 25,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  emptyCircleIcon1: {
    position: 'absolute',
    top: 125, // Moved lower
    left: 100, // Adjusted
    width: 20,
    height: 20,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  emptyGrayCircleIcon1: {
    position: 'absolute',
    top: 175, // Moved lower
    right: 40, // Adjusted
    width: 30,
    height: 30,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  filledCircleIcon1: {
    position: 'absolute',
    top: 123, // Moved lower
    right: 100, // Adjusted
    width: 15,
    height: 15,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  grayStarIcon1: {
    position: 'absolute',
    top: 107, // Moved lower
    right: 180, // Adjusted
    width: 25,
    height: 25,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  illustration: {
    width: 300,
    height: 350,
    resizeMode: 'contain',
    marginBottom: -50,
    zIndex: 9999,
    // border: '1px solid red', // Remove temporary border
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
    zIndex: 10000,
  },
  inputContainer: {
    width: '80%',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#555',
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    backgroundColor: Colors.white,
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    width: '100%',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-start',
    marginBottom: 30,
    paddingLeft: 40,
    paddingRight: 0,
  },
  forgotPasswordText: {
    color: '#777',
    fontSize: 14,
  },
  signupButton: {
    backgroundColor: Colors.darkPurple,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
    position: 'absolute',
    bottom: 190,
    right: 40,
  },
  signupButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  backButton: {
    position: 'absolute',
    top: 60, // Adjust based on SafeAreaView and desired position
    left: 20,
    zIndex: 10002, // Ensure it's above all other elements
  },
});

export default LoginScreen; 