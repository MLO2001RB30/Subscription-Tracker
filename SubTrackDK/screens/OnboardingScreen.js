import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';

const OnboardingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/Mads SubTrack.jpeg')}
          style={styles.onboardingImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>SubsTrack</Text>
        <Text style={styles.subtitle}>
          Hold styr på dine abonnementer og spar penge.
        </Text>
        <TouchableOpacity style={styles.getStartedButton} onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.getStartedButtonText}>Fortsæt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.orangeBackground,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  onboardingImage: {
    width: '80%',
    height: '80%',
  },
  content: {
    flex: 0.7,
    width: '100%',
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: 'center',
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: Colors.accentColor,
    borderRadius: 15,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  getStartedButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen; 