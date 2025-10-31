import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const EmptyStateScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abonnementer</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('NewSubscription')}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.imageCard}>
          {/* Placeholder for the image */}
          <Image
            source={null}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Ingen abonnementer fundet</Text>
        <Text style={styles.subtitle}>
          Tilføj dit første abonnement for at begynde at holde styr på dine udgifter.
        </Text>
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={() => navigation.navigate('NewSubscription')}
        >
          <Text style={styles.connectButtonText}>Tilføj abonnement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  settingsButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCard: {
    backgroundColor: Colors.orangeBackground,
    borderRadius: 15,
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  cardImage: {
    width: '70%',
    height: '70%',
  },
  title: {
    fontSize: 20,
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
  connectButton: {
    backgroundColor: Colors.accentColor,
    borderRadius: 15,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  connectButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EmptyStateScreen; 