import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { LineChart } from 'react-native-chart-kit';

const SummaryScreen = ({ navigation }) => {
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [top3Expensive, setTop3Expensive] = useState([]);
  const [categorySpending, setCategorySpending] = useState([]);
  const [monthlyHistory, setMonthlyHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSubscriptions, setHasSubscriptions] = useState(false);
  const [userName, setUserName] = useState('Jonathan');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      console.log('🎯 SummaryScreen: Fetching summary data...');
      const response = await api.get('/user/summary');
      const summaryData = response.data;

      console.log('📊 SummaryScreen: Summary data received:', summaryData);
      setMonthlyTotal(summaryData.monthly_total);
      setTop3Expensive(summaryData.top3_expensive);
      setCategorySpending(summaryData.category_spending);
      setMonthlyHistory(summaryData.monthly_history);
      setHasSubscriptions(summaryData.monthly_total > 0 || summaryData.top3_expensive.length > 0);
      setError(null);
      console.log('✅ SummaryScreen: Data updated, hasSubscriptions:', summaryData.monthly_total > 0 || summaryData.top3_expensive.length > 0);
    } catch (err) {
      console.error('❌ SummaryScreen: Error fetching summary:', err.response?.data || err.message);
      setError('Kunne ikke hente oversigt. Tjek om du er logget ind, og om serveren kører.');
      Alert.alert('Fejl', 'Kunne ikke hente oversigt. Tjek om du er logget ind, og om serveren kører.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSummary();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 SummaryScreen: Screen focused - refreshing data...');
      fetchSummary();
    }, [])
  );

  const getCategoryColor = (index) => {
    const colors = ['#1db954', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    return colors[index % colors.length];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 SummaryScreen: Manual refresh triggered');
    await fetchSummary();
    setRefreshing(false);
  };

  // Combine mock and user subscriptions (This logic is now handled by the backend)
  // const allSubscriptions = [...(mockSubscriptions || []), ...(subscriptions || [])];

  // Calculate monthly total for all subscriptions (This logic is now handled by the backend)
  // const monthlyTotal = allSubscriptions.reduce((acc, sub) => { ... }, 0);

  // Calculate monthly spending history (This logic is now handled by the backend)
  // const monthlySpendingHistory = allSubscriptions.reduce((acc, sub) => { ... }, {});
  // const sortedMonths = Object.keys(monthlySpendingHistory).sort().reverse();

  // Top 3 most expensive subscriptions (This logic is now handled by the backend)
  // const top3Subscriptions = [...allSubscriptions].sort((a, b) => b.price - a.price).slice(0, 3);

  // Average spending per category (This logic is now handled by the backend)
  // const categorySpending = allSubscriptions.reduce((acc, sub) => { ... }, {});
  // const averageCategorySpending = Object.keys(categorySpending).map(category => ({ ... }));

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentColor} />
        <Text style={styles.loadingText}>Henter oversigt...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  // Chart data preparation
  const chartData = Object.keys(monthlyHistory).length > 1 ? {
    labels: Object.keys(monthlyHistory).sort().slice(-6).map(month => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
      if (month.includes(' ')) {
        const monthNum = parseInt(month.split(' ')[0]) - 1;
        return monthNames[monthNum] || month.slice(0, 3);
      }
      return month.slice(0, 3);
    }),
    datasets: [{
      data: Object.keys(monthlyHistory).sort().slice(-6).map(month => monthlyHistory[month] || 0),
      color: (opacity = 1) => `rgba(29, 185, 84, ${opacity})`, // Spotify green
      strokeWidth: 2
    }]
  } : null;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hej, {userName} 👋🏽</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={Colors.textColor} />
        </TouchableOpacity>
      </View>

      {!hasSubscriptions ? (
        /* Empty State - No Subscriptions */
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateCard}>
            <Ionicons name="card-outline" size={64} color={Colors.secondaryTextColor} style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateTitle}>Velkommen til SubTrack!</Text>
            <Text style={styles.emptyStateSubtitle}>
              Du har endnu ikke tilføjet nogen abonnementer. Kom i gang ved at forbinde din bank eller uploade et kontoudtog.
            </Text>
            
            <View style={styles.emptyStateActions}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={() => navigation.navigate('Bank')}
              >
                <Ionicons name="link" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Forbind bank</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => navigation.navigate('Bank')}
              >
                <Ionicons name="document-text-outline" size={20} color={Colors.accentColor} style={{ marginRight: 8 }} />
                <Text style={styles.secondaryButtonText}>Upload kontoudtog</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Main Overview - Has Subscriptions */
        <View style={styles.content}>
          {/* Monthly Spending Section */}
          <View style={styles.section}>
            <Text style={styles.spendingLabel}>Månedligt forbrug</Text>
            <Text style={styles.spendingAmount}>{monthlyTotal.toLocaleString('da-DK')} kr</Text>
            <View style={styles.spendingChange}>
              <Ionicons name="trending-up" size={16} color={Colors.spotifyGreen} />
              <Text style={styles.changeText}>+4.9% Fra sidste måned</Text>
            </View>
          </View>

          {/* Chart Section */}
          {chartData && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Udgifter</Text>
                <Text style={styles.sectionPeriod}>Sidste 6 måneder</Text>
              </View>
              
              {/* Actual chart */}
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - 40}
                height={180}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(29, 185, 84, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#1db954'
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}
          
          {!chartData && Object.keys(monthlyHistory).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Udgifter</Text>
                <Text style={styles.sectionPeriod}>Ikke nok data</Text>
              </View>
              
              {/* Placeholder for insufficient data */}
              <View style={styles.chartPlaceholder}>
                <Ionicons name="analytics-outline" size={48} color={Colors.secondaryTextColor} />
                <Text style={styles.chartPlaceholderText}>Upload flere måneder for at se trend</Text>
              </View>
            </View>
          )}

          {/* Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kategorier</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Subscriptions')}>
                <Text style={styles.seeAllText}>Se alle</Text>
              </TouchableOpacity>
            </View>
            
            {/* Vertical category list */}
            {categorySpending.map((cat, idx) => (
              <View key={cat.category} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(idx) }]} />
                  <Text style={styles.categoryName}>{cat.category}</Text>
                </View>
                <Text style={styles.categoryAmount}>{cat.total.toLocaleString('da-DK')} kr</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    color: Colors.textColor,
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 5,
    backgroundColor: Colors.white,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textColor,
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  emptyStateCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: Colors.secondaryTextColor,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.accentColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.accentColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: Colors.accentColor,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
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
  },
  sectionPeriod: {
    fontSize: 14,
    color: Colors.secondaryTextColor,
    fontWeight: '500',
  },
  spendingLabel: {
    fontSize: 16,
    color: Colors.secondaryTextColor,
    marginBottom: 8,
  },
  spendingAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textColor,
    marginBottom: 8,
  },
  spendingChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    color: Colors.secondaryTextColor,
    marginLeft: 4,
  },

  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 8,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: Colors.secondaryTextColor,
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.accentColor,
    fontWeight: '500',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: Colors.textColor,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textColor,
  },


});

export default SummaryScreen; 