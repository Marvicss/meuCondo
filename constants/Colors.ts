// constants/Colors.ts

// 1. Definimos as cores da sua marca
const azulPrincipal = '#3A82F7';
const azulEscuro = '#0B1B2B'; // Essa cor não será mais usada no fundo, mas pode manter aqui
const amareloAcao = '#FFC400';

// 2. Criamos a paleta para o TEMA CLARO
export const CoresClaras = {
  primary: azulPrincipal,
  onPrimary: '#FFFFFF',
  text: '#1C1C1E',
  background: '#F8F8F8', 
  onBackground: '#1C1C1E', 
  surface: '#FFFFFF',
  onSurface: '#1C1C1E',
  outline: '#7D7D7D',
};

// 3. TEMA ESCURO (TRUQUE: Apenas espelhamos as cores claras)
// Ao fazer isso, o modo escuro vira o modo claro.
export const CoresEscuras = CoresClaras;