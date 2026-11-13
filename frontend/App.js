import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, PlusSquare, User } from 'lucide-react-native';

import { ReaderPreferencesProvider } from './src/context/ReaderPreferencesContext';
import { COLORS } from './src/config/theme';
import AuthScreen from './src/app/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import CreateScreen from './src/screens/CreateScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import StoryFormScreen from './src/screens/StoryFormScreen';
import ChapterEditScreen from './src/screens/ChapterEditScreen';
import ReadStoryScreen from './src/screens/ReadStoryScreen';
import ReaderSettingsScreen from './src/screens/ReaderSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const isWeb = Platform.OS === 'web';
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.background, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarPosition: isWeb ? 'top' : 'bottom',
      }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tab.Screen name="Buscar" component={SearchScreen} options={{ tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }} />
      <Tab.Screen name="Crear" component={CreateScreen} options={{ tabBarIcon: ({ color, size }) => <PlusSquare color={color} size={size} /> }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ReaderPreferencesProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Activity" component={ActivityScreen} />
          <Stack.Screen name="StoryForm" component={StoryFormScreen} />
          <Stack.Screen name="ChapterEdit" component={ChapterEditScreen} />
          <Stack.Screen name="ReadStory" component={ReadStoryScreen} />
          <Stack.Screen name="ReaderSettings" component={ReaderSettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ReaderPreferencesProvider>
  );
}
