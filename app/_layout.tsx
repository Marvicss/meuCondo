import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, Portal } from 'react-native-paper';
// =========================================================================
// ## CORREÇÃO ESTÁ AQUI ##
// Trocamos o caminho do import de '@/' para '../'
// =========================================================================
import { CoresClaras, CoresEscuras } from '../constants/Colors';

export default function RootLayout() {
  // Detecta o tema do celular ('light', 'dark', ou null)
  const colorScheme = useColorScheme();

  // Cria os dois temas completos, mesclando os padrões do Material com nossas cores
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

  // Escolhe qual tema usar com base na configuração do celular
  const temaDoApp = colorScheme === 'dark' ? temaEscuro : temaClaro;

  return (
    // Passa o tema dinâmico para o PaperProvider
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