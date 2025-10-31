import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);

  // Load subscriptions from AsyncStorage on app start
  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const stored = await AsyncStorage.getItem('importedSubscriptions');
      if (stored) {
        const parsedSubs = JSON.parse(stored);
        console.log('🔄 Context: Loaded subscriptions from storage:', parsedSubs.length);
        setSubscriptions(parsedSubs);
      } else {
        console.log('🔄 Context: No stored subscriptions found');
      }
    } catch (error) {
      console.error('❌ Context: Failed to load subscriptions:', error);
    }
  };

  const addSubscription = (newSubscription) => {
    setSubscriptions((prevSubscriptions) => {
      const updated = [...prevSubscriptions, newSubscription];
      // Save to AsyncStorage whenever we add a subscription
      saveSubscriptions(updated);
      return updated;
    });
  };

  const saveSubscriptions = async (subs) => {
    try {
      await AsyncStorage.setItem('importedSubscriptions', JSON.stringify(subs));
      console.log('💾 Context: Saved subscriptions to storage');
    } catch (error) {
      console.error('❌ Context: Failed to save subscriptions:', error);
    }
  };

  const clearSubscriptions = async () => {
    try {
      await AsyncStorage.removeItem('importedSubscriptions');
      setSubscriptions([]);
      console.log('🗑️ Context: Cleared all subscriptions');
    } catch (error) {
      console.error('❌ Context: Failed to clear subscriptions:', error);
    }
  };

  const setSubscriptionsWithSave = (subs) => {
    setSubscriptions(subs);
    saveSubscriptions(subs);
  };

  return (
    <SubscriptionContext.Provider value={{ 
      subscriptions, 
      setSubscriptions: setSubscriptionsWithSave, 
      addSubscription,
      clearSubscriptions 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
}; 