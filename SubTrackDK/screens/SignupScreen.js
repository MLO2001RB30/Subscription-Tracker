import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import Colors from '../constants/Colors';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import { signup } from "../api/api";

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleSignup = async () => {
    try {
      await signup(email, password, name);
      Alert.alert('Succes', 'Konto oprettet! Du kan nu logge ind.');
      navigation.navigate('Login');
    } catch (err) {
      setError('Registrering fejlede');
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.outerContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={30} color={Colors.darkPurple} />
      </TouchableOpacity>
      <Image source={require('../assets/star_icon.png')} style={styles.starIcon1} />
      <Image source={require('../assets/empty_circle_icon.png')} style={styles.emptyCircleIcon1} />
      <Image source={require('../assets/empty_gray_circle_icon.png')} style={styles.emptyGrayCircleIcon1} />
      <Image source={require('../assets/filled_circle_icon.png')} style={styles.filledCircleIcon1} />
      <Image source={require('../assets/gray_star_icon.png')} style={styles.grayStarIcon1} />

      <Image
        source={require('../assets/signup_illustration.png')}
        style={styles.illustration}
        onError={(e) => console.log('Signup Illustration Load Error:', e.nativeEvent.error)}
      />

      <Text style={styles.title}>Opret konto</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Navn</Text>
        <TextInput
          style={styles.input}
          placeholder="Navn"
          placeholderTextColor={Colors.lightText}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
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

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Opret konto</Text>
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
  starIcon1: {
    position: 'absolute',
    top: 150,
    left: 30,
    width: 25,
    height: 25,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  emptyCircleIcon1: {
    position: 'absolute',
    top: 80,
    left: 80,
    width: 20,
    height: 20,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  emptyGrayCircleIcon1: {
    position: 'absolute',
    top: 100,
    right: 50,
    width: 30,
    height: 30,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  filledCircleIcon1: {
    position: 'absolute',
    top: 180,
    right: 75,
    width: 15,
    height: 15,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  grayStarIcon1: {
    position: 'absolute',
    top: 220,
    right: 40,
    width: 25,
    height: 25,
    resizeMode: 'contain',
    zIndex: 10001,
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginTop: 40,
    marginBottom: 0,
    zIndex: 9999,
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
  signupButton: {
    backgroundColor: Colors.darkPurple,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
    position: 'absolute',
    bottom: 100,
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
    top: 60,
    left: 20,
    zIndex: 10002,
  },
});

export default SignupScreen; 