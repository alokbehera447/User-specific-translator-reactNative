// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';

// Simple loading screen fallback
const LoadingFallback = () => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0ea5e9',
    }}>
    <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
      Loading Translator...
    </Text>
  </View>
);

const App = (): React.JSX.Element => {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0ea5e9"
        translucent={true}
      />
      <AppProvider>
        <NavigationContainer fallback={<LoadingFallback />}>
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
};

export default App;
