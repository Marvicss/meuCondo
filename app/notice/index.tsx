import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Text, Chip, useTheme } from 'react-native-paper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from 'jwt-decode';

// Interfaces
interface Aviso {
  id: number;
  tipo: string;
  mensagem: string;
  cor?: string; 
}

interface DecodedToken { userId: string; email: string; userType: string; iat: number; exp: number; }

export default function QuadroAvisos() {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState('Todos');
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null); // Mantido para consistência

  const API_NEWS_URL = 'https://meu-condo.vercel.app/news/';

  useFocusEffect(
    useCallback(() => {
      const fetchAvisos = async () => {
        setLoading(true);
        setError(null);

        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            Alert.alert("Autenticação Necessária", "Por favor, faça o login para ver os avisos.");
            setError("Token de autenticação não encontrado.");
            setLoading(false);
            // Opcional: Redirecionar para tela de login, se tiver um router disponível
            // Ex: router.replace('/login');
            return;
          }

          // Decodificar o token para obter informações do usuário (se necessário)
          // Isso é parte do seu padrão de projeto, mesmo que userInfo não seja usado diretamente aqui
          const decoded = jwtDecode<DecodedToken>(token);
          setUserInfo(decoded);

          const response = await fetch(API_NEWS_URL, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            const message = errorData.message || `Erro desconhecido: ${response.status}`;

            if (response.status === 401 || response.status === 403) {
              Alert.alert("Acesso Negado", "Sua sessão expirou ou você não tem permissão para ver os avisos.");
            } else {
              Alert.alert("Erro ao Carregar Avisos", message);
            }
            setError(message);
            return;
          }

          const data: Aviso[] = await response.json();

          if (!Array.isArray(data)) {
            Alert.alert("Erro", "Resposta inesperada do servidor para avisos.");
            console.error("Resposta recebida:", data);
            setError("Formato de dados inesperado da API.");
            return;
          }
          
          // Mapear os tipos de avisos para cores
          const avisosComCores = data.map(aviso => {
            let cor = '#BDBDBD'; // Cor padrão
            switch (aviso.tipo) {
              case 'Urgente':
                cor = '#D32F2F';
                break;
              case 'Geral':
                cor = '#F2C94C';
                break;
              case 'Manutenção':
                cor = '#BDBDBD';
                break;
              case 'Eventos':
                cor = '#2F80ED';
                break;
              // Adicione outros tipos e cores conforme necessário
            }
            return { ...aviso, cor };
          });

          setAvisos(avisosComCores);
        } catch (e: any) {
          // Tratamento de erros de rede ou outros
          Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor. Verifique sua internet ou tente novamente.");
          setError(`Erro: ${e.message}`);
          console.error("Erro ao buscar avisos:", e);
        } finally {
          setLoading(false);
        }
      };

      fetchAvisos();
    }, [])
  );

  const filteredAvisos = avisos.filter(aviso => {
    if (selectedType === 'Todos') {
      return true;
    }
    return aviso.tipo === selectedType;
  });

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>Filtrar por Tipo</Text>
            <View style={styles.legendContainer}>
              <Chip
                onPress={() => setSelectedType('Todos')}
                style={[
                  styles.legendChip,
                  { backgroundColor: '#6200EE' },
                  selectedType === 'Todos' && styles.selectedChip
                ]}
                textStyle={styles.legendText}
              >
                Todos
              </Chip>
              <Chip
                onPress={() => setSelectedType('Urgente')}
                style={[
                  styles.legendChip,
                  { backgroundColor: '#D32F2F' },
                  selectedType === 'Urgente' && styles.selectedChip
                ]}
                textStyle={styles.legendText}
              >
                Urgente
              </Chip>
              <Chip
                onPress={() => setSelectedType('Geral')}
                style={[
                  styles.legendChip,
                  { backgroundColor: '#F2C94C' },
                  selectedType === 'Geral' && styles.selectedChip
                ]}
                textStyle={styles.legendText}
              >
                Geral
              </Chip>
              <Chip
                onPress={() => setSelectedType('Manutenção')}
                style={[
                  styles.legendChip,
                  { backgroundColor: '#BDBDBD' },
                  selectedType === 'Manutenção' && styles.selectedChip
                ]}
                textStyle={styles.legendText}
              >
                Manutenção
              </Chip>
              <Chip
                onPress={() => setSelectedType('Eventos')}
                style={[
                  styles.legendChip,
                  { backgroundColor: '#2F80ED' },
                  selectedType === 'Eventos' && styles.selectedChip
                ]}
                textStyle={styles.legendText}
              >
                Eventos
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {error ? (
          <Text style={styles.errorText}>Erro ao carregar avisos: {error}</Text>
        ) : filteredAvisos.length === 0 && selectedType === 'Todos' ? (
          <Text style={styles.noAvisosText}>Nenhum aviso cadastrado ainda.</Text>
        ) : filteredAvisos.length === 0 ? (
          <Text style={styles.noAvisosText}>Nenhum aviso encontrado para o tipo "{selectedType}".</Text>
        ) : (
          filteredAvisos.map(aviso => (
            <Card key={aviso.id} style={{ backgroundColor: aviso.cor || theme.colors.surface, marginBottom: 16 }}>
              <Card.Title
                title={aviso.tipo}
                left={() => <View style={[styles.colorBar, { backgroundColor: aviso.cor || '#BDBDBD' }]} />}
              />
              <Card.Content>
                <Text variant="bodyMedium">{aviso.mensagem}</Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    elevation: 2,
  },
  legendText: { color: '#fff' },
  colorBar: { width: 10, height: 40, borderRadius: 3, marginRight: 8 },
  selectedChip: {
    borderColor: '#000',
    borderWidth: 2,
    opacity: 0.8,
  },
  noAvisosText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#D32F2F',
  },
});