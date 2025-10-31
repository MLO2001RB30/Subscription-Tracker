import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import SubscriptionsListScreen from '../screens/SubscriptionsListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SummaryScreen from '../screens/SummaryScreen';
import SubscriptionDetailScreen from '../screens/SubscriptionDetailScreen';
import NewSubscriptionScreen from '../screens/NewSubscriptionScreen';
import BankIntegrationScreen from '../screens/BankIntegrationScreen';

const Tab = createBottomTabNavigator();
const SubscriptionsStack = createNativeStackNavigator();

const SubscriptionsStackScreen = () => (
  <SubscriptionsStack.Navigator screenOptions={{ headerShown: false }}>
    <SubscriptionsStack.Screen name="SubscriptionsList" component={SubscriptionsListScreen} />
    <SubscriptionsStack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
    <SubscriptionsStack.Screen name="NewSubscription" component={NewSubscriptionScreen} />
  </SubscriptionsStack.Navigator>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Overview') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Subscriptions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Bank') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.accentColor,
        tabBarInactiveTintColor: Colors.secondaryTextColor,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Overview" 
        component={SummaryScreen}
        options={{
          title: 'Oversigt'
        }}
      />
      <Tab.Screen 
        name="Subscriptions" 
        component={SubscriptionsStackScreen}
        options={{
          title: 'Abonnementer'
        }}
      />
      <Tab.Screen 
        name="Bank" 
        component={BankIntegrationScreen}
        options={{
          title: 'Bank'
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Indstillinger'
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 