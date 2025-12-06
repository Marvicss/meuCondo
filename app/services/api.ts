// services/api.ts

import { API_URL, API_URL_DEV } from '@/constants/envs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: `${API_URL}`, // Sua URL base
});

const apiDev = axios.create({
  baseURL: `${API_URL_DEV}`, // Sua URL base
});

// Interceptor para anexar token automaticamente
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }
  } catch (e) {
    // silenciosamente ignora; requisição prossegue sem token
  }
  return config;
});

// Opcional: tratamento de respostas 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      // Você pode adicionar lógica para redirecionar ao login ou limpar sessão
      // Ex.: await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;