import { enableScreens } from 'react-native-screens';
enableScreens();

import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
