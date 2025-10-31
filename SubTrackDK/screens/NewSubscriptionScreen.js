import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, TouchableWithoutFeedback, Keyboard, Platform, Modal, KeyboardAvoidingView, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useSubscriptions } from '../context/SubscriptionContext';
import CompanyAutocomplete from '../components/CompanyAutocomplete';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleReminder } from '../services/NotificationService';
import { createSubscription, getSubscriptions, login, signup } from '../api/api';

const NewSubscriptionScreen = ({ navigation }) => {
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('Månedligt');
  const [renewalDate, setRenewalDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [category, setCategory] = useState('Andet');
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  const categories = ['Streaming', 'Musik', 'Nyheder', 'Opbevaring', 'Fitness', 'Andet'];
  const frequencyOptions = [
    { label: 'Ugentligt', value: 'Ugentligt' },
    { label: 'Månedligt', value: 'Månedligt' },
    { label: 'Kvartalsvist', value: 'Kvartalsvist' },
    { label: 'Halvårligt', value: 'Halvårligt' },
    { label: 'Årligt', value: 'Årligt' }
  ];

  const { addSubscription } = useSubscriptions();

  const showSuccessAnimationAndNavigate = () => {
    setShowSuccessAnimation(true);
    
    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide animation and navigate after 1.2 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessAnimation(false);
        navigation.goBack();
      });
    }, 1200);
  };

  const handleAddSubscription = async () => {
    if (!companyName || !domain || !amount || !frequency || !renewalDate || !category) {
      Alert.alert('Fejl', 'Udfyld venligst alle felter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const [day, month, year] = renewalDate.split('.').map(Number);
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      const newSubscriptionData = {
        title: companyName,
        amount: parseFloat(amount),
        renewal_date: formattedDate,
        category: category,
        logo_url: domain ? `https://logo.clearbit.com/${domain}` : null,
        currency: 'DKK'
      };

      const createdSubscription = await createSubscription(newSubscriptionData);

      addSubscription({
        id: createdSubscription.id.toString(),
        name: createdSubscription.title,
        domain: domain,
        price: createdSubscription.amount,
        renewalDate: formattedDate,
        type: 'custom', 
        frequency: frequency,
        category: createdSubscription.category,
      });

      const renewalDateObject = new Date(year, month - 1, day);
      scheduleReminder(renewalDateObject, companyName);

      // Show success animation instead of alert
      setIsSubmitting(false);
      showSuccessAnimationAndNavigate();
    } catch (error) {
      console.error('Error adding subscription:', error.response?.data || error.message);
      setIsSubmitting(false);
      Alert.alert('Fejl', error.response?.data?.detail || 'Kunne ikke tilføje abonnement. Tjek om du er logget ind, og om serveren kører.');
    }
  };

  const onDateChange = (event, date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const showDatepicker = () => {
    setShowDatePickerModal(true);
  };

  const handleFrequencySelect = (value) => {
    setFrequency(value);
    setShowFrequencyPicker(false);
  };

  const handleConfirmDate = () => {
    setRenewalDate(selectedDate.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    setShowDatePickerModal(false);
  };

  const handleCancelDate = () => {
    setShowDatePickerModal(false);
    setSelectedDate(new Date());
  };

  const handleCategorySelect = (value) => {
    setCategory(value);
    setShowCategoryPickerModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nyt abonnement</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Virksomhedsnavn</Text>
              <CompanyAutocomplete
                onSelect={({ name, domain }) => {
                  setCompanyName(name);
                  setDomain(domain);
                }}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Beløb (kr.)</Text>
              <TextInput
                style={styles.input}
                placeholder="F.eks. 89.00"
                placeholderTextColor="#999999"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fornyelsesfrekvens</Text>
              <TouchableOpacity 
                style={styles.dropdownInput}
                onPress={() => setShowFrequencyPicker(true)}
              >
                <Text style={styles.dropdownText}>{frequency}</Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kategori</Text>
              <TouchableOpacity 
                style={styles.dropdownInput}
                onPress={() => setShowCategoryPickerModal(true)}
              >
                <Text style={styles.dropdownText}>{category}</Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Næste fornyelsesdato</Text>
              <TouchableOpacity onPress={showDatepicker} style={styles.dropdownInput}>
                <Text
                  style={renewalDate ? styles.dropdownText : styles.placeholderText}
                >
                  {renewalDate || "Vælg næste fornyelsesdato"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666666" />
              </TouchableOpacity>
              <Text style={styles.infoText}>Opdateres automatisk når der sker betaling</Text>
            </View>

            <TouchableOpacity 
              style={[styles.addButton, isSubmitting && styles.addButtonDisabled]} 
              onPress={handleAddSubscription}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.addButtonText}>Tilføj abonnement</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modern Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFrequencyPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modernModalContent}>
                <View style={styles.modernModalHeader}>
                  <Text style={styles.modernModalTitle}>Vælg frekvens</Text>
                  <TouchableOpacity 
                    onPress={() => setShowFrequencyPicker(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                  {frequencyOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionItem,
                        frequency === option.value && styles.selectedOptionItem,
                        index === frequencyOptions.length - 1 && styles.lastOptionItem
                      ]}
                      onPress={() => handleFrequencySelect(option.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        frequency === option.value && styles.selectedOptionText
                      ]}>
                        {option.label}
                      </Text>
                      {frequency === option.value && (
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

      {/* Modern Category Picker Modal */}
      <Modal
        visible={showCategoryPickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPickerModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCategoryPickerModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modernModalContent}>
                <View style={styles.modernModalHeader}>
                  <Text style={styles.modernModalTitle}>Vælg kategori</Text>
                  <TouchableOpacity 
                    onPress={() => setShowCategoryPickerModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                  {categories.map((cat, index) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.optionItem,
                        category === cat && styles.selectedOptionItem,
                        index === categories.length - 1 && styles.lastOptionItem
                      ]}
                      onPress={() => handleCategorySelect(cat)}
                    >
                      <Text style={[
                        styles.optionText,
                        category === cat && styles.selectedOptionText
                      ]}>
                        {cat}
                      </Text>
                      {category === cat && (
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

      {/* Modern Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePickerModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modernModalContent}>
                <View style={styles.modernModalHeader}>
                  <Text style={styles.modernModalTitle}>Vælg fornyelsesdato</Text>
                  <TouchableOpacity 
                    onPress={() => setShowDatePickerModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
                    onChange={onDateChange}
                    style={styles.datePicker}
                    textColor="#333333"
                    accentColor="#1db954"
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={handleCancelDate} style={styles.modalButtonCancel}>
                      <Text style={styles.modalButtonCancelText}>Annuller</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleConfirmDate} style={styles.modalButtonConfirm}>
                      <Text style={styles.modalButtonConfirmText}>Bekræft</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <View style={styles.successOverlay}>
          <Animated.View 
            style={[
              styles.successAnimationContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }
            ]}
          >
            <View style={styles.successCheckmarkContainer}>
              <Ionicons name="checkmark" size={60} color="#ffffff" />
            </View>
          </Animated.View>
        </View>
      )}
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownText: {
    color: '#333333',
    fontSize: 16,
  },
  placeholderText: {
    color: '#999999',
    fontSize: 16,
  },
  infoText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#1db954',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
    shadowColor: '#1db954',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  addButtonDisabled: {
    backgroundColor: '#a0a0a0',
    shadowOpacity: 0.1,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  successAnimationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCheckmarkContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1db954',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1db954',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  modernModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
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
    overflow: 'hidden',
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
  datePickerContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  datePicker: {
    backgroundColor: '#ffffff',
    width: '100%',
    height: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButtonCancel: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtonCancelText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonConfirm: {
    backgroundColor: '#1db954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#1db954',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewSubscriptionScreen; 