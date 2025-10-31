import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, SafeAreaView, Linking } from 'react-native';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../context/SubscriptionContext';

const getBackgroundColor = (type) => {
  // Always return the green Spotify color for consistency
  return '#1db954';
};

const SubscriptionDetailScreen = ({ route, navigation }) => {
  const { subscription } = route.params;
  const [logoError, setLogoError] = useState(false);
  const { deleteSubscription } = useSubscriptions();

  // Try to extract domain from title if no domain is provided (same logic as SubscriptionsListScreen)
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
  
  // Helper to build Clearbit URL with high resolution
  const buildClearbitUrl = (domain) => `https://logo.clearbit.com/${domain}?size=512`;

  // Use logo_url from DB, otherwise try Clearbit based on known domains / title
  const clearbitLogoUrl = subscription.logo_url ? subscription.logo_url :
    subscription.domain ? buildClearbitUrl(subscription.domain) :
    (getDomainFromTitle(subscription.title) ? buildClearbitUrl(getDomainFromTitle(subscription.title)) : null);

  const handleDeleteSubscription = () => {
    Alert.alert(
      "Annullér abonnement",
      "Er du sikker på, at du vil fjerne dette abonnement fra listen?",
      [
        { text: "Annullér", style: "cancel" },
        {
          text: "Ja, slet",
          onPress: () => {
            deleteSubscription(subscription.id);
            navigation.goBack();
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const formattedRenewalDate = (() => {
    const dateObj = new Date(subscription.renewal_date);
    if (isNaN(dateObj)) return subscription.renewal_date;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('da-DK', options);
  })();

  // Determine source based on subscription data
  const getSubscriptionSource = () => {
    if (subscription.type === 'custom' || subscription.type === 'manual') {
      return 'Manuel';
    } else {
      return 'Kontoudtog';
    }
  };

  // Get cancellation URL based on service
  const getCancellationUrl = () => {
    const title = subscription.title?.toLowerCase() || '';
    const domain = subscription.domain || getDomainFromTitle(subscription.title);
    
    // Known cancellation URLs for popular services
    const cancellationUrls = {
      'netflix': 'https://www.netflix.com/cancelplan',
      'disney plus': 'https://www.disneyplus.com/account/subscription',
      'disney+': 'https://www.disneyplus.com/account/subscription',
      'spotify': 'https://www.spotify.com/account/subscription/',
      'prime video': 'https://www.amazon.com/gp/video/mystuff/managesubscriptions',
      'amazon prime': 'https://www.amazon.com/gp/video/mystuff/managesubscriptions',
      'hbo': 'https://play.hbomax.com/subscription',
      'viaplay': 'https://viaplay.dk/account/subscription',
      'yousee': 'https://mit.yousee.dk/privat/abonnement',
      'telia': 'https://mit.telia.dk/abonnement',
      'tryg': 'https://www.tryg.dk/privat/min-side',
    };
    
    // Check for exact match first
    if (cancellationUrls[title]) {
      return cancellationUrls[title];
    }
    
    // Check if title contains any of the service names
    for (const [service, url] of Object.entries(cancellationUrls)) {
      if (title.includes(service)) {
        return url;
      }
    }
    
    // Fallback to main domain if we have it
    if (domain) {
      return `https://${domain}`;
    }
    
    return null;
  };

  const handleCancelSubscription = async () => {
    const cancellationUrl = getCancellationUrl();
    
    if (cancellationUrl) {
      Alert.alert(
        "Opsig abonnement",
        "Du vil blive dirigeret til hjemmesiden hvor du kan opsige dit abonnement.",
        [
          { text: "Annullér", style: "cancel" },
          {
            text: "Åbn hjemmeside",
            onPress: () => {
              Linking.openURL(cancellationUrl).catch(err => {
                Alert.alert('Fejl', 'Kunne ikke åbne hjemmesiden. Prøv at opsige dit abonnement manuelt.');
              });
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        "Opsig abonnement",
        "Vi har ikke en direkte link til opsigelse for denne tjeneste. Du skal opsige abonnementet gennem deres hjemmeside eller kundeservice.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <TouchableOpacity onPress={handleDeleteSubscription} style={styles.deleteIcon}>
          <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.topCard}>
          <View style={[styles.imageContainer, { backgroundColor: getBackgroundColor(subscription.type) }]}>
            {clearbitLogoUrl && !logoError ? (
              <Image
                source={{ uri: clearbitLogoUrl }}
                style={styles.logo}
                resizeMode="cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Ionicons name="cube-outline" size={40} color="#ffffff" />
            )}
          </View>
          <Text style={styles.serviceName}>{String(subscription.title)}</Text>
          <Text style={styles.price}>
            {String(subscription.amount.toFixed(2))} kr.
            {subscription.frequency ? ` / ${String(subscription.frequency)}` : ' månedligt'}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailContent}>
              <Ionicons name="calendar-outline" size={20} color="#666666" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Næste fornyelse</Text>
                <Text style={styles.detailValue}>{formattedRenewalDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailContent}>
              <Ionicons name="information-circle-outline" size={20} color="#666666" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Kilde</Text>
                <Text style={styles.detailValue}>{getSubscriptionSource()}</Text>
              </View>
            </View>
          </View>

          {subscription.category && (
            <View style={styles.detailRow}>
              <View style={styles.detailContent}>
                <Ionicons name="pricetag-outline" size={20} color="#666666" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Kategori</Text>
                  <Text style={styles.detailValue}>{subscription.category}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
              <Text style={styles.cancelButtonText}>Opsig abonnement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
  backButton: {
    padding: 5,
  },
  deleteIcon: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topCard: {
    backgroundColor: 'transparent',
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
  },
  imageContainer: {
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 6,
    textAlign: 'center',
  },
  price: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  actionsContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    marginTop: 5,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});

export default SubscriptionDetailScreen; 