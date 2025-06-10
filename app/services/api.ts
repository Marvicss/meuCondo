// services/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://meu-condo.vercel.app', // Sua URL base
});

// Futuramente, você pode adicionar interceptors para injetar o token de autenticação
// em todas as requisições que precisam.
// api.interceptors.request.use(async (config) => {
//   const token = await getTokenFromStorage(); // Função para pegar token do AsyncStorage
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default api;