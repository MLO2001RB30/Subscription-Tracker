import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Indstillinger</Text>
        <View style={{ width: 24 }} /> { /* Spacer for alignment */}
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Konto</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="person-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Profil</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="people-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Tilsluttede konti</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Indstillinger</Text>
        <View style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Notifikationer</Text>
          <Switch
            trackColor={{ false: "#f0f0f0", true: "#1db954" }}
            thumbColor="#ffffff"
            ios_backgroundColor="#f0f0f0"
            onValueChange={() => setNotificationsEnabled(previousState => !previousState)}
            value={notificationsEnabled}
          />
        </View>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="cash-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Valuta</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="card-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Abonnementer</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Hjælpcenter</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="mail-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Kontakt os</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="chatbox-ellipses-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Feedback</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="document-text-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Vilkår og betingelser</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="lock-closed-outline" size={24} color="#1db954" style={styles.itemIcon} />
          <Text style={styles.itemText}>Privatlivspolitik</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 70,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemIcon: {
    marginRight: 15,
  },
  itemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
});

export default SettingsScreen; 