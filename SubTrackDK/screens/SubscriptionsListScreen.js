import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions, // Import Dimensions for dynamic width if needed
  Modal,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { getSubscriptions } from '../api/api';
import { useFocusEffect } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

const SubscriptionItem = ({ item, onPress }) => {
  const [logoError, setLogoError] = useState(false);
  
  // Try to extract domain from title if no domain is provided
  const getDomainFromTitle = (title) => {
    if (!title) return null;
    const lower = title.toLowerCase();
    const domainMap = {
      // Streaming / Entertainment
      'disney plus': 'disneyplus.com',
      'disney+': 'disneyplus.com',
      'prime video': 'primevideo.com',
      'amazon prime': 'primevideo.com',
      'viaplay': 'viaplay.com',
      'netflix': 'netflix.com',
      'spotify': 'spotify.com',
      'hbo': 'hbomax.com',
      'splice': 'splice.com',
      'lovable': 'lovablehq.com',
      'loveable': 'lovablehq.com',
      // Telecom / Utilities / Other
      'telia': 'telia.dk',
      'yousee': 'yousee.dk',
      'tryg': 'tryg.dk',
      'openai': 'openai.com',
      // Retail examples
      'elgiganten': 'elgiganten.dk',
    };

    if (domainMap[lower]) return domainMap[lower];

    // Check if any key is contained within the title (handles e.g. "openai *chatgpt")
    for (const [key, domain] of Object.entries(domainMap)) {
      if (lower.includes(key)) return domain;
    }

    // Generic fallback: slugify (remove spaces/plus) and assume .com
    const slug = lower.replace(/[^a-z0-9]/g, '');
    if (slug) return `${slug}.com`;
    return null;
  };
  
  // Helper to build Clearbit URL with size param
  const buildClearbitUrl = (domain) => `https://logo.clearbit.com/${domain}?size=64`;

  // Use logo_url from DB, otherwise try Clearbit based on known domains / title
  const logoSource = item.logo_url ? item.logo_url :
    item.domain ? buildClearbitUrl(item.domain) :
    (getDomainFromTitle(item.title) ? buildClearbitUrl(getDomainFromTitle(item.title)) : null);

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'streaming': return '#1db954';
      case 'music': return '#1db954';
      case 'news': return '#1db954';
      case 'storage': return '#1db954';
      case 'fitness': return '#1db954';
      case 'custom': return '#1db954';
      default: return '#1db954';
    }
  };

  const formattedRenewalDate = (() => {
    const dateObj = new Date(item.renewal_date);
    if (isNaN(dateObj)) return item.renewal_date; // Fallback if invalid date
    const monthNames = [
      'jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.',
      'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'
    ];
    return `${dateObj.getDate()}. ${monthNames[dateObj.getMonth()]}`;
  })();

  return (
    <TouchableOpacity style={styles.subscriptionItem} onPress={onPress}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor(item.type) }]}>
          {logoSource && !logoError ? (
            <Image 
              source={{ uri: logoSource }}
              style={styles.logo}
              resizeMode="contain"
              onError={() => setLogoError(true)}
              defaultSource={require('../assets/default-logo.png')}
            />
          ) : (
            <Ionicons name="cube-outline" size={24} color="#ffffff" />
          )}
        </View>
        <View>
          <Text style={styles.itemName}>{item.title}</Text>
          <Text style={styles.itemDetails}>
            {item.amount.toFixed(2)} kr. • Fornyes den {formattedRenewalDate}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666666" />
    </TouchableOpacity>
  );
};

const SubscriptionsListScreen = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [sortBy, setSortBy] = useState('name');

  // No mock data - using only imported subscriptions

  const categories = ['Alle', 'Streaming', 'Musik', 'Nyheder', 'Opbevaring', 'Fitness', 'Importeret', 'Andet'];
  const sortOptions = [
    { label: 'Navn', value: 'name' },
    { label: 'Pris', value: 'price' },
    { label: 'Dato', value: 'date' }
  ];

  const handleCategorySelect = (value) => {
    setSelectedCategory(value);
    setShowCategoryPicker(false);
  };

  const handleSortSelect = (value) => {
    setSortBy(value);
    setShowSortPicker(false);
  };

  const sortSubscriptions = (subs) => {
    console.log('Sorting by:', sortBy);
    return [...subs].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price':
          return b.amount - a.amount;
        case 'date':
          return new Date(a.renewal_date) - new Date(b.renewal_date);
        default:
          return 0;
      }
    });
  };

  const filteredAndSortedSubscriptions = React.useMemo(() => {
    console.log('🔍 SubscriptionsList: Supabase subscriptions count:', subscriptions.length);
    console.log('🔍 SubscriptionsList: Sample subscription:', subscriptions[0]);
    
    // Use only Supabase subscriptions (proper database storage)
    console.log('✅ Using only Supabase subscriptions:', subscriptions.length);
    
    let filtered = subscriptions;
    
    // Apply category filter
    if (selectedCategory !== 'Alle') {
      filtered = filtered.filter(sub => sub.category === selectedCategory);
    }
    
    console.log('📊 Final filtered subscriptions count:', filtered.length);
    return filtered;
  }, [selectedCategory, subscriptions]);

  // Context now handles loading from AsyncStorage automatically

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const supabaseSubs = await getSubscriptions();
      
      console.log('📊 Fetched from Supabase:', supabaseSubs?.length || 0, 'subscriptions');
      
      // Use Supabase subscriptions directly (includes imported Tink data)
      setSubscriptions(supabaseSubs || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch subscriptions from Supabase:', err);
      setError('Kunne ikke hente abonnementer. Tjek om du er logget ind.');
      Alert.alert(
        'Fejl',
        'Kunne ikke hente abonnementer. Tjek om du er logget ind.'
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 SubscriptionsListScreen focused - fetching from Supabase...');
      fetchSubscriptions(); // Fetch directly from Supabase database
    }, [])
  );

  // Helper to parse renewal date
  const parseRenewalDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Filter for upcoming subscriptions (next 7 days)
  const getUpcomingSubscriptions = (subs) => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    today.setHours(0, 0, 0, 0); 
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    return subs.filter(sub => {
      const renewalDate = parseRenewalDate(sub.renewal_date);
      if (renewalDate) {
        return renewalDate >= today && renewalDate <= sevenDaysFromNow;
      }
      return false;
    });
  };

  // Filter for active subscriptions (not upcoming or past)
  const getActiveSubscriptions = (subs, upcomingSubs) => {
    const upcomingIds = new Set(upcomingSubs.map(s => s.id));
    return subs.filter(sub => !upcomingIds.has(sub.id));
  };

  const upcomingSubscriptions = React.useMemo(() => {
    const upcoming = getUpcomingSubscriptions(filteredAndSortedSubscriptions);
    return sortSubscriptions(upcoming);
  }, [filteredAndSortedSubscriptions, sortBy]);

  const activeSubscriptions = React.useMemo(() => {
    const active = getActiveSubscriptions(filteredAndSortedSubscriptions, upcomingSubscriptions);
    return sortSubscriptions(active);
  }, [filteredAndSortedSubscriptions, upcomingSubscriptions, sortBy]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1db954" />
        <Text style={styles.loadingText}>Henter abonnementer...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.retryButtonText}>Prøv at logge ind igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abonnementer</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Ionicons name="filter-outline" size={24} color="#333333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => setShowSortPicker(true)}
          >
            <Ionicons name="swap-vertical" size={24} color="#333333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addSubscriptionButton}
            onPress={() => navigation.navigate('NewSubscription')}
          >
            <Ionicons name="add" size={28} color="#1db954" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Show empty state if no subscriptions match filter */}
      {(!filteredAndSortedSubscriptions || filteredAndSortedSubscriptions.length === 0) ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="add-circle-outline" size={48} color="#1db954" />
          <Text style={styles.emptyText}>
            {selectedCategory === 'Alle' ? 'Ingen abonnementer endnu' : `Ingen ${selectedCategory.toLowerCase()} abonnementer`}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('NewSubscription')}
          >
            <Text style={styles.addButtonText}>Tilføj abonnement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {upcomingSubscriptions.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Kommende betalinger</Text>
              <View style={styles.listContent}>
                {upcomingSubscriptions.map((item) => (
                  <SubscriptionItem 
                    key={item.id.toString() + '-upcoming'}
                    item={item}
                    onPress={() => navigation.navigate('SubscriptionDetail', { subscription: item })}
                  />
                ))}
              </View>
            </View>
          )}

          {activeSubscriptions.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Aktive</Text>
              <View style={styles.listContent}>
                {activeSubscriptions.map((item) => (
                  <SubscriptionItem 
                    key={item.id.toString() + '-active'}
                    item={item}
                    onPress={() => navigation.navigate('SubscriptionDetail', { subscription: item })}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modernModalContent}>
                <View style={styles.modernModalHeader}>
                  <Text style={styles.modernModalTitle}>Filtrer efter kategori</Text>
                  <TouchableOpacity 
                    onPress={() => setShowCategoryPicker(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.optionItem,
                        selectedCategory === category && styles.selectedOptionItem,
                        index === categories.length - 1 && styles.lastOptionItem
                      ]}
                      onPress={() => handleCategorySelect(category)}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedCategory === category && styles.selectedOptionText
                      ]}>
                        {category}
                      </Text>
                      {selectedCategory === category && (
                        <Ionicons name="checkmark" size={20} color="#1db954" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showSortPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSortPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modernModalContent}>
                <View style={styles.modernModalHeader}>
                  <Text style={styles.modernModalTitle}>Sorter efter</Text>
                  <TouchableOpacity 
                    onPress={() => setShowSortPicker(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                  {sortOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionItem,
                        sortBy === option.value && styles.selectedOptionItem,
                        index === sortOptions.length - 1 && styles.lastOptionItem
                      ]}
                      onPress={() => handleSortSelect(option.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        sortBy === option.value && styles.selectedOptionText
                      ]}>
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <Ionicons name="checkmark" size={20} color="#1db954" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 80, // Increased padding for SafeAreaView effect
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#333333',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyText: {
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1db954',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#1db954',
    padding: 15,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 5,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  addSubscriptionButton: {
    padding: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Extra padding at bottom
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    marginLeft: 20, // Align with list items
  },
  listContent: {
    paddingHorizontal: 20,
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10, // Changed to 10 for square-ish appearance
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logo: {
    width: '105%',
    height: '105%',
    borderRadius: 10,
  },
  itemName: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetails: {
    color: '#666666',
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 100, // Space for status bar and header
  },
  modernModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: '70%',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden', // Ensures rounded corners are respected
  },
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modernModalTitle: {
    color: '#333333',
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#ffffff',
  },
  optionText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '400',
  },
  selectedOptionItem: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#1db954',
  },
  selectedOptionText: {
    color: '#1db954',
    fontWeight: '600',
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
});

export default SubscriptionsListScreen;