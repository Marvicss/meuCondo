// constants/Colors.ts

// 1. Definimos as cores da sua marca
const azulPrincipal = '#3A82F7';
const amareloAcao = '#FFC400';

// 2. Criamos a paleta para o TEMA CLARO
export const CoresClaras = {
  // Cor principal para botões e elementos ativos (azul)
  primary: azulPrincipal,
  // Cor do texto/ícones em cima da cor primária
  onPrimary: '#FFFFFF',
  
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
  // Cor principal para botões e elementos ativos (amarelo)
  primary: amareloAcao,
  // Cor do texto/ícones em cima da cor primária
  onPrimary: '#212121', // Um preto forte para bom contraste no amarelo

  // Cor de fundo do app (preto)
  background: '#121212', // Um preto padrão para Material Design Dark
  // Cor do texto em cima do fundo
  onBackground: '#E0E0E0', // Branco

  // Cor de superfícies como cards e headers (cinza escuro)
  surface: '#1E1E1E',
  // Cor do texto em cima das superfícies
  onSurface: '#E0E0E0',

  // Cor para o contorno de elementos
  outline: '#4A4A4A',
};