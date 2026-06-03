import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, Music, User, FileText, Mic, PlaySquare } from 'lucide-react-native';

// Onboarding & Auth Screens
import SplashScreen from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Main Core Screens
import HomeScreen from '../screens/main/HomeScreen';
import LibraryScreen from '../screens/main/LibraryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Feature Screens
import GenerateMusicScreen from '../screens/features/GenerateMusicScreen';
import LyricsGeneratorScreen from '../screens/features/LyricsGeneratorScreen';
import VocalUploadScreen from '../screens/features/VocalUploadScreen';
import MusicPlayerScreen from '../screens/features/MusicPlayerScreen';

import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') {
            return <HomeIcon color={color} size={size} />;
          } else if (route.name === 'LibraryTab') {
            return <PlaySquare color={color} size={size} />;
          } else if (route.name === 'ProfileTab') {
            return <User color={color} size={size} />;
          }
          return null;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryScreen}
        options={{ title: 'Library' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        {/* Onboarding & Auth */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Main Flow (Bottom Tabs) */}
        <Stack.Screen name="Main" component={BottomTabNavigator} />

        {/* Features */}
        <Stack.Screen name="Generate" component={GenerateMusicScreen} />
        <Stack.Screen name="LyricsGenerator" component={LyricsGeneratorScreen} />
        <Stack.Screen name="VocalUpload" component={VocalUploadScreen} />
        <Stack.Screen name="MusicPlayer" component={MusicPlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
