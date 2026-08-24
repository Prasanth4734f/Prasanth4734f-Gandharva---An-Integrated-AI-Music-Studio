import React from 'react';
import { Platform, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore routine health ping / network timeout warnings in dev LogBox
LogBox.ignoreLogs([
  '[API Timeout]',
  'Request timed out',
  'Network unreachable',
  'Setting a timer for a long period'
]);

// Disable default browser focus ring / rectangular outline on all text inputs globally
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input, textarea, select, [contenteditable], [role="textbox"], input:focus, textarea:focus, select:focus, [contenteditable]:focus, [role="textbox"]:focus {
      outline: none !important;
      outline-style: none !important;
      outline-width: 0 !important;
      box-shadow: none !important;
      border-color: transparent;
    }
    * {
      -webkit-tap-highlight-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
