// app/_layout.tsx

import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, Portal } from 'react-native-paper';
import { CoresClaras, CoresEscuras } from '@/constants/Colors'; // 1. Importa as duas novas paletas

export default function RootLayout() {
  // 2. Detecta o tema do celular ('light', 'dark', ou null)
  const colorScheme = useColorScheme();

  // 3. Cria os dois temas completos, mesclando os padrões do Material com nossas cores
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

  // 4. Escolhe qual tema usar com base na configuração do celular
  const temaDoApp = colorScheme === 'dark' ? temaEscuro : temaClaro;

  return (
    // 5. Passa o tema dinâmico para o PaperProvider
    <PaperProvider theme={temaDoApp}>
      <Portal.Host>
        <Stack initialRouteName="(tabs)">
          <Stack.Screen name="register/index" options={{ headerShown: false }} />
          <Stack.Screen name="login/index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </Portal.Host>
    </PaperProvider>
  );
}