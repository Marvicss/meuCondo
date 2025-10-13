// services/api.ts

import { API_URL } from '@/constants/envs';
import axios from 'axios';

const api = axios.create({
  baseURL: `${API_URL}`, // Sua URL base
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