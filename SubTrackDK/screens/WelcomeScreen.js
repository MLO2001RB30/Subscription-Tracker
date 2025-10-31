import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import GoogleLoginButton from '../components/GoogleLoginButton';
import FacebookLoginButton from '../components/FacebookLoginButton';
import LinkedInLoginButton from '../components/LinkedInLoginButton';
import { loginWithSocialToken } from '../services/api';

const WelcomeScreen = ({ navigation }) => {
  const googleLoginRef = useRef(null);
  const facebookLoginRef = useRef(null);
  const linkedinLoginRef = useRef(null);

  const handleLogin = () => {
    navigation.navigate('Login'); // Navigate to Login screen
  };

  const handleRegister = () => {
    navigation.navigate('Signup'); // Navigate to Signup screen
  };

  const handleGoogleLogin = () => {
    if (googleLoginRef.current) {
      googleLoginRef.current.triggerLogin();
    }
  };

  const handleFacebookLogin = () => {
    if (facebookLoginRef.current) {
      facebookLoginRef.current.triggerLogin();
    }
  };

  const handleLinkedInLogin = () => {
    if (linkedinLoginRef.current) {
      linkedinLoginRef.current.triggerLogin();
    }
  };

  const handleSocialLoginSuccess = async (loginData) => {
    try {
      if (typeof loginData === 'object' && loginData.provider) {
        // New format with user data
        console.log(`${loginData.provider} login successful:`, loginData);
        console.log('User info:', loginData.user);
        
        // Send to backend API
        await loginWithSocialToken(loginData.provider, loginData.accessToken);
        
        navigation.navigate('MainApp');
      } else {
        // Fallback for simple token format
        console.log('Social login successful:', loginData);
        navigation.navigate('MainApp');
      }
    } catch (error) {
      console.error('Error during social login:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Flying objects in background */}
      <Image source={require('../assets/star_icon.png')} style={styles.starIcon1} />
      <Image source={require('../assets/empty_circle_icon.png')} style={styles.emptyCircleIcon1} />
      <Image source={require('../assets/empty_gray_circle_icon.png')} style={styles.emptyGrayCircleIcon1} />
      <Image source={require('../assets/filled_circle_icon.png')} style={styles.filledCircleIcon1} />
      <Image source={require('../assets/gray_star_icon.png')} style={styles.grayStarIcon1} />

      <Image
        source={require('../assets/welcome_illustration2.png')}
        style={styles.illustration}
      />

      <Text style={styles.title}>Velkommen</Text>
      <Text style={styles.subtitle}>Få bedre overblik over dine abonnementer</Text>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log ind</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signupButton} onPress={handleRegister}>
        <Text style={styles.signupButtonText}>Opret konto</Text>
      </TouchableOpacity>

      <Text style={styles.socialText}>Opret dig med</Text>
      <View style={styles.socialIconContainer}>
        <TouchableOpacity onPress={handleFacebookLogin} style={styles.socialIconButton}>
          <Image source={require('../assets/facebook_icon.png')} style={styles.socialIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoogleLogin} style={styles.socialIconButton}>
          <Image source={require('../assets/google_icon.png')} style={styles.socialIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLinkedInLogin} style={styles.socialIconButton}>
          <Image source={require('../assets/linkedin_icon.png')} style={styles.socialIcon} />
        </TouchableOpacity>
      </View>

      {/* Hidden social login components that will be triggered programmatically */}
      <View style={styles.hiddenComponents}>
        <GoogleLoginButton 
          ref={googleLoginRef}
          onLoginSuccess={handleSocialLoginSuccess} 
        />
        <FacebookLoginButton 
          ref={facebookLoginRef}
          onLoginSuccess={handleSocialLoginSuccess} 
        />
        <LinkedInLoginButton 
          ref={linkedinLoginRef}
          onLoginSuccess={handleSocialLoginSuccess} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    position: 'relative', // Needed for absolute positioning of children
  },
  // Styles for flying objects
  starIcon1: {
    position: 'absolute',
    top: 80,
    left: 60,
    width: 30,
    height: 30,
    resizeMode: 'contain',
    zIndex: 2,
  },
  emptyCircleIcon1: {
    position: 'absolute',
    top: 150,
    left: 50,
    width: 25,
    height: 25,
    resizeMode: 'contain',
    zIndex: 2,
  },
  emptyGrayCircleIcon1: {
    position: 'absolute',
    top: 70,
    right: 60,
    width: 35,
    height: 35,
    resizeMode: 'contain',
    zIndex: 2,
  },
  filledCircleIcon1: {
    position: 'absolute',
    top: 180,
    right: 50,
    width: 20,
    height: 40,
    resizeMode: 'contain',
    zIndex: 2,
  },
  grayStarIcon1: {
    position: 'absolute',
    top: 80,
    right: 130,
    width: 30,
    height: 30,
    resizeMode: 'contain',
    zIndex: 2,
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    fontFamily: 'Avenir',
  },
  loginButton: {
    backgroundColor: Colors.darkPurple,
    borderRadius: 30,
    paddingVertical: 15,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.darkPurple,
    borderWidth: 2,
    borderRadius: 30,
    paddingVertical: 15,
    width: '80%',
    alignItems: 'center',
    marginBottom: 30,
  },
  signupButtonText: {
    color: Colors.darkPurple,
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  socialIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  socialIconButton: {
    padding: 10,
  },
  socialIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  hiddenComponents: {
    position: 'absolute',
    left: -1000,
    opacity: 0,
  },
});

export default WelcomeScreen; 