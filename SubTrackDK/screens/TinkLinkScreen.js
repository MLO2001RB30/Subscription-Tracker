import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';

const TINK_CLIENT_ID = 'c5bee9bff49b45aaa32743b49d36901a';
const REDIRECT_URI = 'https://auth.expo.io/@mads_olsen/SubTrackDK';
const BACKEND_URL = 'http://192.168.0.5:8000'; // Local network IP

const TinkLinkScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent double processing

  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    
    // Check if the URL contains the authorization code
    if (url.includes('code=') && !isProcessing) {
      const code = url.split('code=')[1].split('&')[0];
      
      console.log('🔄 Starting token exchange with code:', code.substring(0, 20) + '...');
      setIsProcessing(true); // Prevent multiple calls
      
      try {
        setIsLoading(true);
        // Exchange code for token via backend
        const response = await axios.post(`${BACKEND_URL}/api/tink/token`, {
          code,
        });

        console.log('✅ Token exchange successful');
        const { access_token } = response.data;
        
        // Navigate to import screen with the token
        navigation.replace('ImportSubscriptions', { token: access_token });
      } catch (error) {
        console.error('❌ Error exchanging code for token:', error);
        setError('Fejl ved forbindelse til bank. Prøv igen.');
        setIsLoading(false);
        setIsProcessing(false); // Reset on error
      }
    } else if (url.includes('error=')) {
      // Handle Tink authorization errors
      setError('Bank autorisation blev afbrudt.');
      setIsLoading(false);
    }
  };

  const tinkLinkUrl = `https://link.tink.com/1.0/authorize/?client_id=${TINK_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=accounts:read,transactions:read&market=DK&locale=da_DK&response_type=code`;

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              setIsProcessing(false); // Reset processing flag
            }}
          >
            <Text style={styles.retryButtonText}>Prøv igen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Gå tilbage</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: tinkLinkUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
      )}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentColor} />
          <Text style={styles.loadingText}>Forbinder til din bank...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryBackground,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.accentColor,
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: Colors.primaryBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: Colors.accentColor,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  backButtonText: {
    color: Colors.primaryBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: Colors.primaryBackground,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default TinkLinkScreen; 