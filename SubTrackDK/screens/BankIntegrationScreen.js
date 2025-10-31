import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Colors from '../constants/Colors';
import { createSubscription } from '../api/api';

/**
 * Simple placeholder screen that lets the user start the Tink Link flow.
 * If the user has already connected one or more banks we could show a status list here.
 * For now we only expose a single "Connect bank" button.
 */
const BACKEND_URL = 'http://192.168.0.5:8080'; // Local network IP

const BankIntegrationScreen = ({ navigation }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnalyzingPDF, setIsAnalyzingPDF] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([
    // In real app this would come from API - for now showing empty state
    // { id: 1, bank: 'Danske Bank', accountNumber: '••••7391', balance: '17,298.92', type: 'Lønkonto' },
    // { id: 2, bank: 'Nordea', accountNumber: '••••2847', balance: '5,432.10', type: 'Opsparingskonto' }
  ]);

  const handleConnectBank = () => {
    setIsConnecting(true);
    // Navigate to the WebView-based Tink Link flow defined in TinkLinkScreen.tsx
    navigation.navigate('TinkLink');
    // We do not reset the local loading state here because the flow will leave this screen.
  };

  // Helper function to extract domain from company name for Clearbit API
  const getDomainFromCompanyName = (companyName) => {
    const lowerName = companyName.toLowerCase();
    
    const domainMap = {
      'netflix': 'netflix.com',
      'spotify': 'spotify.com',
      'disney+': 'disneyplus.com',
      'yousee': 'yousee.dk',
      'telia': 'telia.dk',
      'telenor': 'telenor.dk',
      'seas-nve': 'seas-nve.dk',
      'ørsted': 'orsted.dk',
      'tryg': 'tryg.dk',
      'alka': 'alka.dk',
      'codan': 'codan.dk',
      'sats': 'sats.com',
      'fitness world': 'fitnessworld.com',
      'adobe': 'adobe.com',
      'microsoft': 'microsoft.com',
      'dropbox': 'dropbox.com',
      'google': 'google.com',
      'apple': 'apple.com'
    };

    if (domainMap[lowerName]) {
      return domainMap[lowerName];
    }

    for (const [key, domain] of Object.entries(domainMap)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return domain;
      }
    }

    return null;
  };

  const handleUploadPDF = async () => {
    try {
      setIsAnalyzingPDF(true);
      
      // Pick PDF document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsAnalyzingPDF(false);
        return;
      }

      console.log('📄 Selected PDF:', result.assets[0]);

      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Fejl', 'Du skal være logget ind for at uploade kontoudtog');
        setIsAnalyzingPDF(false);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        type: 'application/pdf',
        name: result.assets[0].name || 'kontoudtog.pdf',
      });

      console.log('🤖 Sending PDF to OpenAI for analysis...');

      // Send PDF to backend for OpenAI analysis
      const response = await axios.post(`${BACKEND_URL}/api/ai/analyze-pdf`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(`🎯 OpenAI detected ${response.data.subscriptions?.length || 0} subscriptions from PDF`);

      if (response.data.subscriptions && response.data.subscriptions.length > 0) {
        // Save detected subscriptions to Supabase
        let savedCount = 0;
        for (const sub of response.data.subscriptions) {
          const logoUrl = getDomainFromCompanyName(sub.name) ? 
            `https://logo.clearbit.com/${getDomainFromCompanyName(sub.name)}` : null;
          
          const subscriptionData = {
            title: sub.name,
            amount: sub.amount,
            renewal_date: sub.renewal_date,
            category: sub.category,
            currency: 'DKK',
            logo_url: logoUrl
          };
          
          // Only add transaction_date if it exists and is not null
          if (sub.transaction_date) {
            subscriptionData.transaction_date = sub.transaction_date;
          }

          try {
            await createSubscription(subscriptionData);
            savedCount++;
            console.log('✅ Saved PDF subscription:', sub.name);
          } catch (error) {
            console.error('❌ Failed to save PDF subscription:', sub.name, error);
          }
        }

        Alert.alert(
          'Success! 🎉',
          `OpenAI fandt ${response.data.subscriptions.length} abonnementer i dit kontoudtog.\n\n${savedCount} abonnementer blev gemt.`,
          [
            {
              text: 'Se abonnementer',
              onPress: () => navigation.navigate('MainApp', { screen: 'Subscriptions' })
            }
          ]
        );
      } else {
        Alert.alert(
          'Ingen abonnementer fundet',
          'OpenAI kunne ikke identificere nogen abonnementer i dit kontoudtog. Prøv med et andet kontoudtog eller tilføj abonnementer manuelt.'
        );
      }

    } catch (error) {
      console.error('❌ PDF upload error:', error);
      Alert.alert(
        'Fejl',
        'Der opstod en fejl under analyse af kontoudtog: ' + (error.response?.data?.detail || error.message)
      );
    } finally {
      setIsAnalyzingPDF(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hej, Jonathan</Text>
        <Text style={styles.welcomeText}>Administrer dine bankforbindelser</Text>
      </View>

      {/* Connected Accounts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Forbundne konti</Text>
        {connectedAccounts.length > 0 ? (
          connectedAccounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.bankIcon}>
                  <Ionicons name="card" size={24} color={Colors.accentColor} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.bankName}>{account.bank}</Text>
                  <Text style={styles.accountType}>{account.type}</Text>
                </View>
                <View style={styles.accountBalance}>
                  <Text style={styles.balanceAmount}>{account.balance} DKK</Text>
                  <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>Ingen banker forbundet</Text>
            <Text style={styles.emptyStateSubtext}>Forbind din bank for at importere abonnementer automatisk</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hurtige handlinger</Text>
        
        {/* Connect Bank Button */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]} 
          onPress={handleConnectBank}
          disabled={isConnecting}
        >
          <View style={styles.actionIcon}>
            {isConnecting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="link" size={20} color={Colors.white} />
            )}
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Forbind bank</Text>
            <Text style={styles.actionSubtitle}>Sikker Tink-integration</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* Upload PDF Button */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryAction]} 
          onPress={handleUploadPDF}
          disabled={isAnalyzingPDF}
        >
          <View style={[styles.actionIcon, styles.secondaryActionIcon]}>
            {isAnalyzingPDF ? (
              <ActivityIndicator size="small" color={Colors.accentColor} />
            ) : (
              <Ionicons name="document-text" size={20} color={Colors.accentColor} />
            )}
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, styles.secondaryActionTitle]}>Upload kontoudtog</Text>
            <Text style={[styles.actionSubtitle, styles.secondaryActionSubtitle]}>
              {isAnalyzingPDF ? '🤖 OpenAI analyserer...' : 'PDF analyse med OpenAI'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.accentColor} />
        </TouchableOpacity>
      </View>

      {/* Recent Activity Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seneste aktivitet</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Subscriptions' })}>
            <Text style={styles.seeAllText}>Se alle</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="add-circle" size={16} color="#4CAF50" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Netflix</Text>
              <Text style={styles.activitySubtitle}>Nyt abonnement tilføjet</Text>
            </View>
            <Text style={styles.activityAmount}>-79 DKK</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="sync-circle" size={16} color="#2196F3" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Spotify</Text>
              <Text style={styles.activitySubtitle}>Abonnement opdateret</Text>
            </View>
            <Text style={styles.activityAmount}>-99 DKK</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textColor,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.secondaryTextColor,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textColor,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.accentColor,
    fontWeight: '500',
  },
  accountCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textColor,
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: Colors.secondaryTextColor,
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textColor,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 14,
    color: Colors.secondaryTextColor,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textColor,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.secondaryTextColor,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryAction: {
    backgroundColor: Colors.accentColor,
  },
  secondaryAction: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  secondaryActionIcon: {
    backgroundColor: '#F0F8F0',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  secondaryActionTitle: {
    color: Colors.textColor,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryActionSubtitle: {
    color: Colors.secondaryTextColor,
  },
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textColor,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: Colors.secondaryTextColor,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
});

export default BankIntegrationScreen; 