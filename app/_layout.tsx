// app/_layout.tsx - VERSÃO CORRIGIDA

import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, Portal } from 'react-native-paper';
import { CoresClaras, CoresEscuras } from '../constants/Colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const temaClaro = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...CoresClaras,
    },
  };

  const temaEscuro = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...CoresEscuras,
    },
  };

  const temaDoApp = colorScheme === 'dark' ? temaEscuro : temaClaro;

  return (
    <PaperProvider theme={temaDoApp}>
      <Portal.Host>
        {/* ======================================================= */}
        {/* ## CORREÇÃO 1: 'initialRouteName' foi removido.      ## */}
        {/* Agora o Expo Router vai procurar por 'index.tsx'      */}
        {/* como a tela inicial padrão.                         */}
        {/* ======================================================= */}
        <Stack>
          {/* =============================================================== */}
          {/* ## CORREÇÃO 2: Adicionamos a tela 'index' ao navegador.     ## */}
          {/* Isso registra sua tela inicial (o antigo 'inicio.tsx').     */}
          {/* =============================================================== */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* As outras telas continuam aqui para que a navegação funcione */}
          <Stack.Screen name="login/index" options={{ headerShown: false }} />
          <Stack.Screen name="register/index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </Portal.Host>
    </PaperProvider>
  );
}