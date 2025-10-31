import { enableScreens } from 'react-native-screens';
enableScreens();

import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}

{
  "expo"; {
    "name"; "Subsify",
    "slug"; "subsify",
    "scheme"; "subsify",
    "version"; "1.0.0",
    "orientation"; "portrait",
    "icon"; "./assets/icon.png",
    "userInterfaceStyle"; "light",
    "splash"; {
      "image"; "./assets/splash.png",
      "resizeMode"; "contain",
      "backgroundColor"; "#ffffff"
    },
    "updates"; {
      "fallbackToCacheTimeout"; 0
    },
    "assetBundlePatterns"; ["**/*"],
    "ios"; {
      "bundleIdentifier"; "com.ditnavn.subsify",
      "supportsTablet"; false
    },
    "android"; {
      "package"; "com.ditnavn.subsify"
    },
    "extra"; {
      "eas"; {
        "projectId"; "98d7b878-b1d1-4d6c-9ad1-370a345f90a7" 
      }
    }
  }
}