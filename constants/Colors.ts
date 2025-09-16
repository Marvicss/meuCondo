// constants/Colors.ts

// 1. Definimos as cores da sua marca
const azulPrincipal = '#3A82F7';
const azulEscuro = '#0B1B2B';
const amareloAcao = '#FFC400';

// 2. Criamos a paleta para o TEMA CLARO
export const CoresClaras = {
  // Cor principal para botões e elementos ativos (azul)
  primary: azulPrincipal,
  // Cor do texto/ícones em cima da cor primária
  onPrimary: '#FFFFFF',
  // Texto padrão
  text: '#1C1C1E',
  
  // Cor de fundo do app (branco)
  background: '#F5F5F5', // Um branco levemente acinzentado é mais confortável
  // Cor do texto em cima do fundo
  onBackground: '#1C1C1E', // Preto

  // Cor de superfícies como cards e headers (branco puro)
  surface: '#FFFFFF',
  // Cor do texto em cima das superfícies
  onSurface: '#1C1C1E',

  // Cor para o contorno de elementos
  outline: '#7D7D7D',
};

// 3. Criamos a paleta para o TEMA ESCURO
export const CoresEscuras = {
  // Cor principal para botões e elementos ativos (azul)
  primary: azulPrincipal,
  // Variação para containers/realces
  primaryContainer: '#123B6D',
  // Cor do texto/ícones em cima da cor primária
  onPrimary: '#FFFFFF',
  // Texto padrão
  text: '#E6EAF0',

  // Cor de fundo do app (preto)
  background: '#0D1117', // preto grafite (GitHub dark)
  // Cor do texto em cima do fundo
  onBackground: '#D0D7E1',

  // Cor de superfícies como cards e headers (cinza escuro)
  surface: '#111827', // cinza-azulado
  // Cor do texto em cima das superfícies
  onSurface: '#E6EAF0',
  onSurfaceVariant: '#A7B0BE',

  // Cor para o contorno de elementos
  outline: '#2A3441',
};