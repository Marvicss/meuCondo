// app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="morador" // Aponta para o arquivo morador.tsx
        options={{
          title: 'Reservar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-plus" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="sindico" // Aponta para o arquivo sindico.tsx
        options={{
          title: 'Gerenciar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-crown" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}