// app/(tabs)/_layout.tsx - VERSÃO CORRIGIDA PARA A NOVA ESTRUTURA

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Esconde o título no topo
      }}
    >
      <Tabs.Screen
        // O nome da rota agora inclui a pasta 'reservas'
        name="reservas/morador"
        options={{
          title: 'Reservar', // O texto que aparece na aba
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-plus" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        // O nome da rota agora inclui a pasta 'reservas'
        name="reservas/sindico"
        options={{
          title: 'Gerenciar', // O texto que aparece na aba
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-crown" color={color} size={size} />
          ),
        }}
      />
     
      {/* Se você ainda tiver a tela 'explore', precisa garantir que o arquivo
          app/(tabs)/explore.tsx existe, ou remover esta linha abaixo. */}
      <Tabs.Screen
        name="explore"
        options={{
            href: null, // Esconde esta aba da barra
        }}
      />
    </Tabs>
  );
}