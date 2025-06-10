import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const COLORS = {
  primaryBlue: '#2F80ED',
  white: '#FFFFFF',
};

export default function ParkingLotLayout() {
  return (
    <View style={{ flex: 1 , paddingBottom: 40 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primaryBlue },
          headerTintColor: COLORS.white,
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Vagas do Condomínio' }} />
        <Stack.Screen name="[id]" options={{ title: 'Detalhes da Vaga' }} />
        <Stack.Screen name="new" options={{ title: 'Criar Nova Vaga' }} />
        <Stack.Screen name="edit/[id]" options={{ title: 'Editar Vaga' }} />
      </Stack>
    </View>
  );
}
