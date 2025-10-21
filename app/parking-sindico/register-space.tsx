// Salve este arquivo como app/register-space.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const RegisterSpaceScreen = () => {
  const theme = useTheme();
  const router = useRouter();

  const [spaceName, setSpaceName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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

      // **IMPORTANTE**: Substitua pela sua URL de API real para criar vagas
      const response = await fetch(`https://meu-condo.vercel.app/parking-spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: spaceName,
          description: description,
          // Outros campos que sua API possa exigir, como condominiumId
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso!', 'A vaga foi cadastrada com sucesso.');
        router.back(); // Volta para a tela anterior (Gerenciar Vagas)
      } else {
        const errorData = await response.json();
        Alert.alert('Erro no Cadastro', errorData.message || 'Não foi possível cadastrar a vaga.');
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
        {/* O header com o título "Cadastrar Vaga" e o botão de voltar
            será configurado automaticamente pelo Expo Router no _layout.tsx.
            <Stack.Screen options={{ title: 'Cadastrar Nova Vaga' }} /> 
        */}
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