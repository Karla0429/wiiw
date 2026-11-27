import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, PlusSquare, User } from 'lucide-react-native';

import { supabase } from './src/config/supabase';
import { AppThemeProvider, useAppTheme } from './src/context/AppThemeContext';
import { ReaderPreferencesProvider } from './src/context/ReaderPreferencesContext';
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

function WebTabBar({ state, descriptors, navigation }) {
  const { width } = useWindowDimensions();
  const { colors, themeName } = useAppTheme();
  const compact = width < 600;

  return (
    <View style={[styles.webTabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.webTabBarBrand}>
        <Image
          source={themeName === 'dark'
            ? require('./assets/wiiw-logo-dark.png')
            : require('./assets/wiiw-logo.png')}
            style={[styles.webTabBarLogo, compact && styles.webTabBarLogoCompact]}
            resizeMode="contain"
            accessibilityLabel="wiiw"
          />
      </View>
      <View style={styles.webTabBarItems}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title || route.name;
          const color = focused ? colors.accent : colors.muted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel || label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={[styles.webTabBarButton, focused && { backgroundColor: colors.accentSoft }]}
            >
              {options.tabBarIcon?.({ focused, color, size: 20 })}
              {!compact && <Text style={[styles.webTabBarLabel, { color }]}>{label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  const isWeb = Platform.OS === 'web';
  const { colors } = useAppTheme();
  return (
    <Tab.Navigator
      tabBar={isWeb ? (props) => <WebTabBar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
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

const styles = StyleSheet.create({
  webTabBar: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  webTabBarBrand: {
    width: 180,
    height: 64,
    justifyContent: 'center',
  },
  webTabBarLogo: {
    width: 150,
    height: 54,
  },
  webTabBarLogoCompact: {
    width: 100,
    height: 42,
  },
  webTabBarItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webTabBarButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  webTabBarLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function AppContent() {
  const { colors, themeName } = useAppTheme();
  const [initialRouteName, setInitialRouteName] = useState(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!active) return;
        if (error) console.error('Error restoring auth session:', error);
        setInitialRouteName(session ? 'Main' : 'Auth');
      })
      .catch((error) => {
        if (!active) return;
        console.error('Error restoring auth session:', error);
        setInitialRouteName('Auth');
      });

    return () => {
      active = false;
    };
  }, []);

  if (!initialRouteName) {
    return (
      <View style={[styles.sessionLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
        <Stack.Screen name="StoryForm" component={StoryFormScreen} />
        <Stack.Screen name="ChapterEdit" component={ChapterEditScreen} />
        <Stack.Screen name="ReadStory" component={ReadStoryScreen} />
        <Stack.Screen name="ReaderSettings" component={ReaderSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <ReaderPreferencesProvider>
        <AppContent />
      </ReaderPreferencesProvider>
    </AppThemeProvider>
  );
}
