import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/types';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DecksScreen from './src/screens/DecksScreen';
import DeckDetailScreen from './src/screens/DeckDetailScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import UploadScreen from './src/screens/UploadScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Decks"
          component={DecksScreen}
          options={{ title: 'My Decks' }}
        />
        <Stack.Screen
          name="DeckDetail"
          component={DeckDetailScreen}
          options={{ title: 'Deck Details' }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: 'Review Cards' }}
        />
        <Stack.Screen
          name="Upload"
          component={UploadScreen}
          options={{ title: 'Import Deck' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
