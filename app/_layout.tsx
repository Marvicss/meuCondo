import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider, Portal } from 'react-native-paper';
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
    
        <Stack>
          {/* 1. Adicionamos a linha para o nosso novo menu */}
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />

          {/* Telas que continuam como estavam */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login/index" options={{ headerShown: false }} />
          <Stack.Screen name="register/index" options={{ headerShown: false }} />
          <Stack.Screen name="reservas/morador" options={{ headerShown: false }} />
          <Stack.Screen name="reservas/sindico" options={{ headerShown: false }} />
          <Stack.Screen name="addAccountability/index" options={{ headerShown: false }} />
          <Stack.Screen name="prestacao-morador/index" options={{ headerShown: false }} />
          <Stack.Screen name="notice/index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* 2. Removemos as linhas de 'home' e 'parking', pois agora elas 
                 são gerenciadas pelo layout '(drawer)' */}

        </Stack>
      </Portal.Host>
    </PaperProvider>
  );
}