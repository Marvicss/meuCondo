// hooks/useThemeColor.ts

import { useColorScheme } from 'react-native';

// Importa as nossas duas paletas de cores com o caminho relativo correto
import { CoresClaras, CoresEscuras } from '../constants/Colors';

// Define que as propriedades 'light' e 'dark' são opcionais
type ThemeProps = {
  light?: string;
  dark?: string;
};

// O nome da cor deve existir tanto no tema claro quanto no escuro
type ColorName = keyof typeof CoresClaras & keyof typeof CoresEscuras;

export function useThemeColor(
  props: ThemeProps,
  colorName: ColorName,
) {
  // Pega o tema atual do dispositivo (light ou dark)
  const theme = useColorScheme() ?? 'light';
  // Verifica se uma cor foi passada diretamente nas propriedades do componente
  const colorFromProps = props[theme];

  if (colorFromProps) {
    // Se uma cor foi passada via props (ex: <ThemedView lightColor="#FFF" />), usa ela.
    return colorFromProps;
  } else {
    // Senão, busca a cor da nossa paleta de temas globais.
    // Seleciona a paleta correta...
    const themeColors = theme === 'dark' ? CoresEscuras : CoresClaras;
    // ...e então retorna a cor específica (ex: 'primary' ou 'background')
    return themeColors[colorName];
  }
}