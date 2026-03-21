// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TranslatorScreen from '../screens/TranslatorScreen';
import AccentLibraryScreen from '../screens/AccentLibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';


const ACTIVE = '#0ea5e9';
const INACTIVE = '#94a3b8';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ----------------------------------------
   Tab Button Component
---------------------------------------- */
const TabButton = ({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) => {
  const iconColor = focused ? '#ffffff' : INACTIVE;

  return (
    <View style={styles.tabWrapper}>
      {focused ? (
        <LinearGradient
          colors={[ACTIVE, '#38bdf8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeIconBackground}>
          <Icon name={icon} size={17} color={iconColor} />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveIconBackground}>
          <Icon name={icon} size={17} color={INACTIVE} />
        </View>
      )}

      <Text
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

/* ----------------------------------------
   Bottom Tab Navigator (Main Tabs)
---------------------------------------- */
const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Translator"
      screenOptions={{
        headerStyle: { backgroundColor: ACTIVE },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabButton icon="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Translator"
        component={TranslatorScreen}
        options={{
          title: 'Translate',
          tabBarIcon: ({ focused }) => (
            <TabButton icon="microphone" label="Translate" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AccentLibrary"
        component={AccentLibraryScreen}
        options={{
          title: 'Voices',
          tabBarIcon: ({ focused }) => (
            <TabButton icon="book" label="Voices" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabButton icon="cog" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/* ----------------------------------------
   Stack Navigator with Auth Check
---------------------------------------- */
const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<'Splash' | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Always start from Splash first — more professional flow
        setInitialRoute('Splash');
      } catch (err) {
        console.log('Error checking token:', err);
        setInitialRoute('Splash');
      }
    };
    checkToken();
  }, []);

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
        }}>
        <ActivityIndicator size="large" color={ACTIVE} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}>
      {/* Splash is now the global first screen */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
};


/* ----------------------------------------
   Styles
---------------------------------------- */
import { StyleSheet, Text } from 'react-native';

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 6,
    left: 10,
    right: 10,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 6,
    overflow: 'visible',
  },
  tabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  activeIconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
    marginTop: 9,
  },
  inactiveIconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 0,
    fontSize: 11,
    color: INACTIVE,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: ACTIVE,
    fontWeight: '600',
  },
});

export default AppNavigator;
