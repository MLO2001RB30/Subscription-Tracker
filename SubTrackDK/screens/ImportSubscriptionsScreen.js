import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Colors from '../constants/Colors';
import { createSubscription } from '../api/api';

const BACKEND_URL = 'http://192.168.0.5:8080'; // Local network IP

// Component to display logo with fallback
const SubscriptionLogo = ({ logoUrl, name }) => {
  const [logoError, setLogoError] = useState(false);

  if (logoUrl && !logoError) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={styles.subscriptionLogo}
        resizeMode="contain"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <View style={styles.subscriptionLogoFallback}>
      <Ionicons name="cube-outline" size={24} color={Colors.white} />
    </View>
  );
};

// Transaction and DetectedSubscription types removed - now using plain JavaScript

const ImportSubscriptionsScreen = ({ route, navigation }) => {
  const { token } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [detectedSubscriptions, setDetectedSubscriptions] = useState([]);
  const [error, setError] = useState(null);

  // Helper function to extract domain from company name for Clearbit API
  const getDomainFromCompanyName = (companyName) => {
    const lowerName = companyName.toLowerCase();
    
    // Common domain mappings for Danish/international services
    const domainMap = {
      // Streaming services
      'netflix': 'netflix.com',
      'spotify': 'spotify.com',
      'disney+': 'disneyplus.com',
      'hbo': 'hbo.com',
      'amazon prime': 'amazon.com',
      'youtube premium': 'youtube.com',
      'apple music': 'apple.com',
      'tidal': 'tidal.com',
      'viaplay': 'viaplay.com',
      'tv2 play': 'tv2.dk',
      'drtv': 'dr.dk',
      
      // Telecom/Internet
      'yousee': 'yousee.dk',
      'telia': 'telia.dk',
      'telenor': 'telenor.dk',
      '3': 'tre.dk',
      'tdc': 'tdc.dk',
      
      // Utilities
      'seas-nve': 'seas-nve.dk',
      'ørsted': 'orsted.dk',
      'ewii': 'ewii.dk',
      
      // Insurance
      'tryg': 'tryg.dk',
      'alka': 'alka.dk',
      'codan': 'codan.dk',
      'if forsikring': 'if.dk',
      'topdanmark': 'topdanmark.dk',
      'gjensidige': 'gjensidige.dk',
      'alm. brand': 'almbrand.dk',
      'europæiske': 'europaeiske.dk',
      'falck': 'falck.dk',
      
             // Fitness
       'sats': 'sats.com',
       'fitness world': 'fitnessworld.com',
       'fresh fitness': 'freshfitness.dk',
       'form & fitness': 'formfitness.dk',
       'nordic wellness': 'nordicwellness.dk',
      
      // Software/SaaS
      'adobe': 'adobe.com',
      'microsoft': 'microsoft.com',
      'dropbox': 'dropbox.com',
      'google drive': 'google.com',
      'icloud': 'apple.com',
      'office 365': 'microsoft.com',
      'canva': 'canva.com',
      'figma': 'figma.com',
      'github': 'github.com',
      'slack': 'slack.com',
             'zoom': 'zoom.us',
       'notion': 'notion.so',
       'trello': 'trello.com',
       'asana': 'asana.com',
       'monday.com': 'monday.com',
       'clickup': 'clickup.com',
       'basecamp': 'basecamp.com',
              'jetbrains': 'jetbrains.com',
       'atlassian': 'atlassian.com',
       
       // Danish services
       'nemlig.com': 'nemlig.com',
       'bilka': 'bilka.dk',
       'netto': 'netto.dk',
       'rema 1000': 'rema1000.dk',
       'matas': 'matas.dk',
       'elgiganten': 'elgiganten.dk',
       'power': 'power.dk',
       'harald nyborg': 'haraldnyborg.dk',
       'bauhaus': 'bauhaus.dk',
       'silvan': 'silvan.dk',
       
       // Banks/Finance
       'danske bank': 'danskebank.dk',
       'nordea': 'nordea.dk',
       'jyske bank': 'jyskebank.dk',
       'sydbank': 'sydbank.dk',
       'spar nord': 'sparnord.dk'
     };

    // First try exact match
    if (domainMap[lowerName]) {
      return domainMap[lowerName];
    }

    // Try partial matches
    for (const [key, domain] of Object.entries(domainMap)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return domain;
      }
    }

    // Try to extract domain if it's already in the name (e.g., "netflix.com")
    const domainMatch = lowerName.match(/([a-z0-9\-]+\.[a-z]{2,})/);
    if (domainMatch) {
      return domainMatch[0];
    }

    return null;
  };

  // Helper function to intelligently categorize subscriptions based on company name
  const categorizeSubscription = (companyName) => {
    const lowerName = companyName.toLowerCase();
    
    // Streaming & Entertainment
    if (['netflix', 'spotify', 'disney+', 'hbo', 'amazon prime', 'youtube premium', 
         'apple music', 'tidal', 'viaplay', 'tv2 play', 'drtv', 'discovery+', 
         'paramount+', 'apple tv+', 'crunchyroll'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Streaming & Underholdning';
    }
    
    // Telecom & Internet
    if (['yousee', 'telia', 'telenor', '3', 'tdc', 'mobilepay', 'swipp',
         'oister', 'cbb', 'waoo', 'stofa', 'fullrate', 'kviknet', 'bolignet',
         'fiber', 'bredbånd', 'internet', 'mobil', 'telefon'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Telekom & Internet';
    }
    
    // Utilities (El, Gas, Vand)
    if (['seas-nve', 'ørsted', 'ewii', 'nrgi', 'ok', 'energi fyn', 'trefor',
         'konstant', 'gasel', 'kamstrup', 'radius', 'forsyning', 'energi', 
         'el', 'gas', 'vand', 'varme', 'fjernvarme'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Forsyning';
    }
    
    // Insurance
    if (['tryg', 'alka', 'codan', 'if forsikring', 'topdanmark', 'gjensidige',
         'lærerstandens', 'pfa', 'danica', 'nordea liv', 'seb pension',
         'alm. brand', 'europæiske', 'falck', 'lf forsikring', 'skandia',
         'forsikring', 'pension'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Forsikring & Pension';
    }
    
    // Fitness & Health
    if (['sats', 'fitness world', 'fresh fitness', 'form & fitness', 
         'nordic wellness', 'fitness dk', 'myfitnesspal', 'strava premium',
         'peloton', 'fitnesscenter', 'fitness', 'træning', 'sundhed',
         'wellness', 'yoga', 'pilates'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Fitness & Sundhed';
    }
    
    // Beauty & Personal Care
    if (['matas', 'sephora', 'normal', 'kicks', 'parfume', 'skønhed',
         'beauty', 'kosmetik', 'hudpleje'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Skønhed & Pleje';
    }
    
    // Software & Productivity
    if (['adobe', 'microsoft', 'dropbox', 'google', 'icloud', 'office 365',
         'canva', 'figma', 'github', 'slack', 'zoom', 'notion', 'trello',
         'asana', 'monday.com', 'clickup', 'basecamp', 'jetbrains', 'atlassian',
         'todoist', '1password', 'lastpass'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Software & Produktivitet';
    }
    
    // News & Media
    if (['berlingske', 'politiken', 'jyllands-posten', 'ekstrabladet', 'bt',
         'information', 'weekendavisen', 'new york times', 'wall street journal',
         'financial times', 'economist'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Nyheder & Medier';
    }
    
    // Transportation
    if (['dsb', 'rejsekort', 'uber', 'taxa', 'viggo', 'greenmobility',
         'share now', 'gotaxi'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Transport';
    }
    
    // Food & Delivery
    if (['just eat', 'wolt', 'foodora', 'hungry.dk', 'nemlig.com',
         'aarstiderne', 'rema 1000', 'netto'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Mad & Levering';
    }
    
    // Banking & Finance
    if (['danske bank', 'nordea', 'jyske bank', 'sydbank', 'spar nord',
         'lunar', 'revolut', 'wise', 'trading 212', 'saxo bank'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Bank & Finans';
    }
    
    // Education & Learning
    if (['duolingo', 'babbel', 'rosetta stone', 'skillshare', 'udemy',
         'coursera', 'linkedin learning', 'masterclass'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Uddannelse & Læring';
    }
    
    // Gaming
    if (['playstation', 'xbox', 'nintendo', 'steam', 'epic games',
         'origin', 'uplay', 'battle.net', 'twitch'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Gaming';
    }
    
    // Shopping & Retail
    if (['amazon', 'zalando', 'asos', 'h&m', 'zara', 'boozt', 'ellos',
         'nelly', 'bilka', 'shopping', 'webshop', 'butik'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Shopping & Retail';
    }
    
    // Professional Services
    if (['advokat', 'revisor', 'konsulent', 'rengøring', 'service',
         'professionel', 'erhverv'].some(service => 
         lowerName.includes(service) || service.includes(lowerName))) {
      return 'Professionelle Tjenester';
    }
    
    // Default fallback
    return 'Øvrige';
  };

  useEffect(() => {
    fetchAndAnalyzeTransactions();
  }, []);

  // Function to clean up low-confidence subscriptions from database
  const cleanupLowConfidenceSubscriptions = async () => {
    try {
      console.log('🧹 Starting cleanup of low-confidence subscriptions...');
      
      // Get all subscriptions for current user
      const userToken = await SecureStore.getItemAsync('token');
      const response = await axios.get(`${BACKEND_URL}/api/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      const allSubscriptions = response.data;
      console.log(`📊 Found ${allSubscriptions.length} total subscriptions`);
      
      // Define patterns that are definitely NOT subscriptions
      const definitelyNotSubscriptions = [
        'elgiganten', 'power', 'expert', 'harald nyborg', 'bauhaus', 'silvan',
        'bilka', 'netto', 'fakta', 'superbrugsen', 'rema 1000', 'lidl', 'aldi',
        'mcdonalds', 'burger king', 'kfc', 'subway', 'dominos', 'pizza hut',
        'starbucks', 'baresso', 'espresso house', 'joe & the juice',
        'h&m', 'zara', 'zalando', 'asos', 'matas', 'normal', 'flying tiger',
        'kontanthævning', 'overførsel', 'renteindægter', 'løn', 'pension',
        'tank', 'benzin', 'shell', 'q8', 'ingo', 'ok', 'circle k',
        'parkering', 'billet', 'dsb', 'metro', 'bus'
      ];
      
      // Find subscriptions to delete
      const subscriptionsToDelete = allSubscriptions.filter(sub => {
        const titleLower = sub.title.toLowerCase();
        return definitelyNotSubscriptions.some(pattern => 
          titleLower.includes(pattern) || pattern.includes(titleLower)
        );
      });
      
      console.log(`🗑️ Found ${subscriptionsToDelete.length} subscriptions to delete:`, 
        subscriptionsToDelete.map(s => s.title));
      
      // Delete each false subscription
      for (const sub of subscriptionsToDelete) {
        try {
          await axios.delete(`${BACKEND_URL}/api/subscriptions/${sub.id}`, {
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          });
          console.log(`✅ Deleted: ${sub.title}`);
        } catch (error) {
          console.error(`❌ Failed to delete ${sub.title}:`, error.message);
        }
      }
      
      console.log(`🎯 Cleanup complete! Removed ${subscriptionsToDelete.length} false subscriptions`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  };

  // Function to validate existing subscriptions based on recent transactions
  const validateExistingSubscriptions = async (transactions) => {
    try {
      console.log('🔍 Validating existing subscriptions against recent transactions...');
      
      const userToken = await SecureStore.getItemAsync('token');
      const response = await axios.get(`${BACKEND_URL}/api/subscriptions`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      
      const existingSubscriptions = response.data;
      const subscriptionsToRemove = [];
      
      for (const sub of existingSubscriptions) {
        // Check if this subscription has had any transactions in the last 6 months
        const subTransactions = transactions.filter(tx => {
          const desc = tx.descriptions?.display || tx.descriptions?.original || "";
          return desc.toLowerCase().includes(sub.title.toLowerCase()) || 
                 sub.title.toLowerCase().includes(desc.toLowerCase());
        });
        
        if (subTransactions.length === 0) {
          console.log(`⚠️ No recent transactions found for "${sub.title}" - marking for review`);
          
          // Check if it's been more than 6 months since renewal date
          const renewalDate = new Date(sub.renewal_date);
          const monthsAgo = new Date();
          monthsAgo.setMonth(monthsAgo.getMonth() - 6);
          
          if (renewalDate < monthsAgo) {
            console.log(`🗑️ "${sub.title}" is older than 6 months with no transactions - removing`);
            subscriptionsToRemove.push(sub);
          }
        }
      }
      
      // Remove outdated subscriptions
      for (const sub of subscriptionsToRemove) {
        try {
          await axios.delete(`${BACKEND_URL}/api/subscriptions/${sub.id}`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
          });
          console.log(`✅ Removed outdated subscription: ${sub.title}`);
        } catch (error) {
          console.error(`❌ Failed to remove ${sub.title}:`, error.message);
        }
      }
      
      console.log(`🎯 Validation complete! Removed ${subscriptionsToRemove.length} outdated subscriptions`);
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  };

  const fetchAndAnalyzeTransactions = async () => {
    try {
      console.log('🚀 Starting OpenAI-powered transaction analysis with token:', token?.substring(0, 20) + '...');
      
      const token_value = await SecureStore.getItemAsync('token');
      if (!token_value) {
        throw new Error('Authentication token not found');
      }
      
      // First clean up any existing false subscriptions
      await cleanupLowConfidenceSubscriptions();
      
      // Fetch transactions
      const response = await axios.get(`${BACKEND_URL}/api/tink/transactions`, {
        params: { token }
      });

      console.log('📡 Backend response:', response.status, response.data);
      const { transactions } = response.data;
      console.log('💰 Raw transactions received:', transactions?.length || 0);
      
      if (!transactions || transactions.length === 0) {
        console.log('⚠️ No transactions found');
        setDetectedSubscriptions([]);
        return;
      }
      
      if (transactions.length > 0) {
        console.log('💰 Sample transaction structure:', JSON.stringify(transactions[0], null, 2));
        console.log('💰 Sample description:', transactions[0].descriptions?.display);
        console.log('💰 Sample amount:', transactions[0].amount?.value?.unscaledValue, 'scale:', transactions[0].amount?.value?.scale);
      }
      
      // Use OpenAI to analyze transactions
      console.log('🤖 Sending transactions to OpenAI for analysis...');
      const aiResponse = await axios.post(`${BACKEND_URL}/api/ai/analyze-subscriptions`, {
        transactions: transactions
      }, {
        headers: {
          'Authorization': `Bearer ${token_value}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`🎯 OpenAI detected ${aiResponse.data.subscriptions?.length || 0} subscriptions`);
      
      // Convert AI response to our format
      const detectedSubs = aiResponse.data.subscriptions.map(sub => ({
        name: sub.name,
        price: sub.amount,
        renewalDate: sub.renewal_date,
        transactionDate: sub.transaction_date,
        domain: getDomainFromCompanyName(sub.name) || '',
        confidence: sub.confidence,
        frequency: sub.frequency,
        category: sub.category,
        reasoning: sub.reasoning
      }));
      
      setDetectedSubscriptions(detectedSubs);
      
      // Validate existing subscriptions against current transactions
      await validateExistingSubscriptions(transactions);
      
      // Show success message
      if (detectedSubs.length > 0) {
        console.log(`🎉 OpenAI Success! Found ${detectedSubs.length} subscriptions`);
        detectedSubs.forEach(sub => {
          console.log(`  - ${sub.name}: ${sub.price} DKK (${sub.confidence}% confidence) - ${sub.reasoning}`);
        });
      } else {
        console.log('ℹ️ OpenAI found no subscriptions in your transactions');
      }
      
      // Save detected subscriptions directly to Supabase
      for (const sub of detectedSubs) {
        const logoUrl = sub.domain ? `https://logo.clearbit.com/${sub.domain}` : null;
        
        console.log(`🏷️ Saving "${sub.name}" → Category: "${sub.category}"`);
        
        const subscriptionData = {
          title: sub.name,        // Backend expects 'title' not 'name'
          amount: sub.price,      // Backend expects 'amount' not 'price'
          renewal_date: sub.renewalDate,
          category: sub.category, // Use AI-determined category
          currency: 'DKK',        // Backend expects currency
          logo_url: logoUrl       // Clearbit logo URL
        };
        
        // Only add transaction_date if it exists and is not null
        if (sub.transactionDate) {
          subscriptionData.transaction_date = sub.transactionDate;
        }

        try {
          // Save directly to Supabase database
          console.log('📤 Sending subscription data:', subscriptionData);
          const response = await createSubscription(subscriptionData);
          console.log('✅ Saved subscription to Supabase:', sub.name, response);
        } catch (error) {
          console.error('❌ Failed to save subscription:', sub.name);
          console.error('❌ Error details:', error.response?.data || error.message);
          console.error('❌ Data sent:', subscriptionData);
        }
      }

      // Navigate to Subscriptions tab after a short delay
      setTimeout(() => {
        console.log('🚀 Navigating to Subscriptions tab...');
        try {
          // Method 1: Try nested navigation
          navigation.navigate('MainApp', {
            screen: 'Subscriptions',
            params: {
              screen: 'SubscriptionsList'
            }
          });
        } catch (error) {
          console.log('❌ Nested navigation failed, trying simple navigation...', error);
          // Method 2: Fallback to simple navigation
          navigation.navigate('MainApp');
        }
      }, 2000);

    } catch (error) {
      console.error('Error with OpenAI transaction analysis:', error);
      setError('Der opstod en fejl under AI-analyse af transaktioner: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Local AI detection has been replaced with OpenAI API calls

  // Note: detectSubscriptions function removed - now using OpenAI API directly

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentColor} />
          <Text style={styles.loadingText}>🤖 OpenAI analyserer dine transaktioner...</Text>
          <Text style={styles.loadingSubtext}>Dette kan tage et øjeblik</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.accentColor} />
            <Text style={styles.successTitle}>🎉 AI Import Fuldført!</Text>
            <Text style={styles.successSubtitle}>
              OpenAI fandt {detectedSubscriptions.length} abonnementer i dine transaktioner
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Importerede Abonnementer:</Text>
          {detectedSubscriptions.map((sub, index) => {
            const logoUrl = sub.domain ? `https://logo.clearbit.com/${sub.domain}` : null;
            return (
              <View key={index} style={styles.subscriptionItem}>
                <SubscriptionLogo logoUrl={logoUrl} name={sub.name} />
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionName}>{sub.name}</Text>
                  <Text style={styles.subscriptionPrice}>{sub.price.toFixed(2)} kr./{sub.frequency}</Text>
                </View>
                <Ionicons name="checkmark" size={20} color={Colors.accentColor} />
              </View>
            );
          })}
          
          <Text style={styles.redirectText}>
            Omdirigerer til dine abonnementer...
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: Colors.lightText,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingTop: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 15,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.lightText,
    marginTop: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 15,
  },
  subscriptionItem: {
    backgroundColor: Colors.secondaryBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: Colors.accentColor, // Orange background behind logo
  },
  subscriptionLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 5,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: Colors.lightText,
  },
  redirectText: {
    color: Colors.lightText,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ImportSubscriptionsScreen; 