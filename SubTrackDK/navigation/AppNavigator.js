import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import CreateSubscriptionScreen from '../screens/CreateSubscriptionScreen';
import TinkLinkScreen from '../screens/TinkLinkScreen';
import ImportSubscriptionsScreen from '../screens/ImportSubscriptionsScreen';
import MainTabNavigator from './MainTabNavigator';
import { SubscriptionProvider } from '../context/SubscriptionContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <SubscriptionProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="MainApp"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CreateSubscription" 
            component={CreateSubscriptionScreen}
            options={{ title: 'Tilføj abonnement' }}
          />
          <Stack.Screen
            name="TinkLink"
            component={TinkLinkScreen}
            options={{ headerShown: true, title: 'Forbind bank' }}
          />
          <Stack.Screen
            name="ImportSubscriptions"
            component={ImportSubscriptionsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SubscriptionProvider>
  );
} 