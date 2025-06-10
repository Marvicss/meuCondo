import { Stack } from 'expo-router';
import React from 'react';

const COLORS = {
  primaryBlue: '#2F80ED',
  white: '#FFFFFF',
};

export default function ParkingLotLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primaryBlue,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Vagas de Estacionamento' 
        }} 
      />
    </Stack>
  );
}
