import React from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import StoryToAlbumScreen from '../screens/features/StoryToAlbumScreen';
import CreateSongScreen from '../screens/features/CreateSongScreen';
import VocalUploadScreen from '../screens/features/VocalUploadScreen';
import MusicPlayerScreen from '../screens/features/MusicPlayerScreen';
import MusicEditorScreen from '../screens/features/MusicEditorScreen';
import ShowcaseScreen from '../screens/features/ShowcaseScreen';
import LiveStudioHomeScreen from '../screens/features/LiveStudioHomeScreen';
import PianoStudioScreen from '../screens/features/PianoStudioScreen';
import DrumStudioScreen from '../screens/features/DrumStudioScreen';
import GuitarStudioScreen from '../screens/features/GuitarStudioScreen';
import FluteStudioScreen from '../screens/features/FluteStudioScreen';
import SynthStudioScreen from '../screens/features/SynthStudioScreen';
import OrganStudioScreen from '../screens/features/OrganStudioScreen';
import BassStudioScreen from '../screens/features/BassStudioScreen';
import ViolinStudioScreen from '../screens/features/ViolinStudioScreen';
import SaxophoneStudioScreen from '../screens/features/SaxophoneStudioScreen';
import SitarStudioScreen from '../screens/features/SitarStudioScreen';
import RecordingLibraryScreen from '../screens/features/RecordingLibraryScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import { useAuth } from '../context/AuthContext';

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
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1.5,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
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
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background || '#040608', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        {/* Onboarding & Auth - Default screens for opening */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        {/* Core Main Flow (Bottom Tabs) & Admin */}
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />

        {/* Core Features */}
        <Stack.Screen name="Generate" component={GenerateMusicScreen} />
        <Stack.Screen name="StoryToAlbum" component={StoryToAlbumScreen} />
        <Stack.Screen name="LyricsGenerator" component={LyricsGeneratorScreen} />
        <Stack.Screen name="CreateSong" component={CreateSongScreen} />
        <Stack.Screen name="MusicEditor" component={MusicEditorScreen} />
        <Stack.Screen name="VocalUpload" component={VocalUploadScreen} />
        <Stack.Screen name="MusicPlayer" component={MusicPlayerScreen} />
        <Stack.Screen name="Showcase" component={ShowcaseScreen} />
        
        {/* Live Studio (Playground Instruments) */}
        <Stack.Screen name="LiveStudioHome" component={LiveStudioHomeScreen} />
        <Stack.Screen name="PianoStudio" component={PianoStudioScreen} />
        <Stack.Screen name="DrumStudio" component={DrumStudioScreen} />
        <Stack.Screen name="GuitarStudio" component={GuitarStudioScreen} />
        <Stack.Screen name="FluteStudio" component={FluteStudioScreen} />
        <Stack.Screen name="SynthStudio" component={SynthStudioScreen} />
        <Stack.Screen name="OrganStudio" component={OrganStudioScreen} />
        <Stack.Screen name="BassStudio" component={BassStudioScreen} />
        <Stack.Screen name="ViolinStudio" component={ViolinStudioScreen} />
        <Stack.Screen name="SaxophoneStudio" component={SaxophoneStudioScreen} />
        <Stack.Screen name="SitarStudio" component={SitarStudioScreen} />
        <Stack.Screen name="RecordingLibrary" component={RecordingLibraryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
