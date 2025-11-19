// Salve este arquivo como app/register-space.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appbar, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const RegisterSpaceScreen = () => {
  const theme = useTheme();
  const router = useRouter();

  const [spaceName, setSpaceName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para garantir que temos o condominiumId (igual ao usado em outros lugares)
  const ensureCondominiumId = useCallback(async () => {
    const candidates = ['condominiumId', 'condoId', 'condominioId'];
    for (const key of candidates) {
      const val = await AsyncStorage.getItem(key);
      if (val) return val;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    try {
      let list: any[] = [];
      try {
        const res = await api.get<any[]>('/condominiums', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        list = Array.isArray(res.data) ? res.data : [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          try {
            const res2 = await api.get<any[]>('/condominiums/user', {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            list = Array.isArray(res2.data) ? res2.data : [];
          } catch (innerErr) {
            console.error('Erro ao buscar condomínios:', innerErr);
            return null;
          }
        } else {
          return null;
        }
      }
      return list.length > 0 ? String(list[0].id) : null;
    } catch {
      return null;
    }
  }, []);

  // Função para lidar com o cadastro da vaga
  const handleRegister = async () => {
    // Validação simples para garantir que o nome não está vazio
    if (!spaceName.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, insira o nome da vaga.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        router.replace('/login');
        return;
      }

      // Busca o condominiumId obrigatório
      const condoId = await ensureCondominiumId();
      if (!condoId) {
        Alert.alert('Condomínio não identificado', 'Não foi possível determinar o condomínio do usuário.');
        setLoading(false);
        return;
      }
      
      const payload: any = {
        name: spaceName.trim(),
        capacity: 1, // Campo obrigatório - capacidade mínima de 1 veículo
        available: true, // Vaga criada está disponível
        condominiumId: condoId,
      };

      // Só adiciona description se não estiver vazio
      if (description.trim()) {
        payload.description = description.trim();
      }

      console.log('Criando vaga com payload:', payload);

      try {
        // Usando api do axios ao invés de fetch direto
        const response = await api.post('/parkings/', payload);
        console.log('Resposta sucesso:', response.data);
        Alert.alert('Sucesso!', 'A vaga foi cadastrada com sucesso.');
        router.back();
      } catch (error: any) {
        console.log('Erro completo:', error);
        console.log('Erro response:', error?.response?.data);
        const errorMsg = error?.response?.data?.message || error?.message || 'Não foi possível cadastrar a vaga.';
        Alert.alert('Erro no Cadastro', errorMsg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro de Rede', 'Não foi possível se conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Cadastrar Nova Vaga" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Dados da Nova Vaga
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Preencha as informações abaixo para adicionar uma nova vaga de estacionamento.
        </Text>

        <TextInput
          label="Nome da Vaga (Ex: G1-23, T-05)"
          value={spaceName}
          onChangeText={setSpaceName}
          mode="outlined"
          style={styles.input}
          activeOutlineColor="#0099FF"
        />

        <TextInput
          label="Descrição (Opcional)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          activeOutlineColor="#0099FF"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar Vaga</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0099FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterSpaceScreen;