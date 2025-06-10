import BottomMenu from "@/components/BottomMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Interfaces
interface News {
  id: string;
  condominiumId: string;
  type: string;
  message: string;
  createdAt: string;
}

interface NewsComCor extends News {
  cor: string;
}

interface DecodedToken {
  userId: string;
  email: string;
  userType: string;
  iat: number;
  exp: number;
}

// Função para mapear tipo para cor
const getCorPorTipo = (tipo: string): string => {
  switch (tipo.toLowerCase()) {
    case 'urgente': return '#D32F2F';
    case 'geral': return '#F2C94C';
    case 'manutenção': return '#BDBDBD';
    case 'eventos': return '#2F80ED';
    default: return '#BDBDBD';
  }
};

// Capitaliza a primeira letra
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export default function QuadroAvisos() {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState('Todos');
  const [avisos, setAvisos] = useState<NewsComCor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);

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
            return;
          }

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

          const data: News[] = await response.json();

          if (!Array.isArray(data)) {
            Alert.alert("Erro", "Resposta inesperada do servidor para avisos.");
            console.error("Resposta recebida:", data);
            setError("Formato de dados inesperado da API.");
            return;
          }

          const avisosComCores: NewsComCor[] = data.map(aviso => {
            const tipoCapitalizado = capitalize(aviso.type);
            return {
              ...aviso,
              type: tipoCapitalizado,
              cor: getCorPorTipo(aviso.type),
            };
          });

          setAvisos(avisosComCores);

        } catch (e: any) {
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
    if (selectedType === 'Todos') return true;
    return aviso.type === selectedType;
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
              {['Todos', 'Urgente', 'Geral', 'Manutenção', 'Eventos'].map(tipo => (
                <Chip
                  key={tipo}
                  onPress={() => setSelectedType(tipo)}
                  style={[
                    styles.legendChip,
                    { backgroundColor: getCorPorTipo(tipo) },
                    selectedType === tipo && styles.selectedChip
                  ]}
                  textStyle={styles.legendText}
                >
                  {tipo}
                </Chip>
              ))}
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
            <Card key={aviso.id} style={{ backgroundColor: aviso.cor, marginBottom: 16 }}>
              <Card.Title
                title={aviso.type}
                left={() => <View style={[styles.colorBar, { backgroundColor: aviso.cor }]} />}
              />
              <Card.Content>
                <Text variant="bodyMedium">{aviso.message}</Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <BottomMenu />
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
