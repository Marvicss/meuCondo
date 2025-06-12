import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interfaces necessárias apenas para esta tela
interface News {
  id: string;
  condominiumId: string;
  type: string;
  message: string;
  createdAt: string;
}

// Capitaliza a primeira letra
const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

// Mapeia o tipo do aviso para uma cor específica para a barra lateral
const getCorPorTipo = (tipo: string): string => {
  switch (tipo.toLowerCase()) {
    case 'urgente': return '#D32F2F'; // Vermelho
    case 'geral': return '#FFC400';   // Amarelo
    case 'manutenção': return '#757575'; // Cinza
    case 'eventos': return '#2F80ED';    // Azul
    default: return '#BDBDBD';
  }
};

export default function QuadroAvisos() {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState('Todos');
  const [avisos, setAvisos] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchAvisos = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            Alert.alert("Autenticação Necessária", "Por favor, faça o login para ver os avisos.");
            setLoading(false);
            return;
          }

          // Usando o fetch nativo, como solicitado
          const response = await fetch('https://meu-condo.vercel.app/news/', {
            headers: { "Authorization": `Bearer ${token}` },
          });

          if (!response.ok) {
            // Lança um erro para ser pego pelo bloco catch
            throw new Error(`Falha ao carregar avisos: ${response.statusText}`);
          }
          
          const data: News[] = await response.json();
          
          // Capitaliza o tipo de aviso para consistência
          const avisosFormatados = data.map(aviso => ({
            ...aviso,
            type: capitalize(aviso.type),
          }));

          setAvisos(avisosFormatados);

        } catch (e) {
          console.error("Erro ao buscar avisos:", e);
          Alert.alert("Erro", "Não foi possível carregar os avisos. Verifique sua conexão e tente novamente.");
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
      <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Quadro de Avisos" titleStyle={{ color: theme.colors.onSurface }}/>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>Filtrar por Tipo</Text>
            <View style={styles.chipContainer}>
              {['Todos', 'Urgente', 'Geral', 'Manutenção', 'Eventos'].map(tipo => (
                <Chip
                  key={tipo}
                  onPress={() => setSelectedType(tipo)}
                  mode="outlined"
                  selected={selectedType === tipo}
                  style={[
                    styles.chip,
                    { borderColor: theme.colors.outline },
                    selectedType === tipo && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                  textStyle={{ color: selectedType === tipo ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}
                >
                  {tipo}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {filteredAvisos.length === 0 ? (
          <Text style={[styles.infoText, {color: theme.colors.onSurfaceVariant}]}>
            {selectedType === 'Todos' ? 'Nenhum aviso no momento.' : `Nenhum aviso do tipo "${selectedType}".`}
          </Text>
        ) : (
          filteredAvisos.map(aviso => (
            <Card key={aviso.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardLayout}>
                <View style={[styles.colorStripe, { backgroundColor: getCorPorTipo(aviso.type) }]} />
                <View style={styles.cardContentContainer}>
                  <Card.Content>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 4, fontWeight: 'bold' }}>
                      {aviso.type}
                    </Text>
                    <Divider style={{ marginBottom: 8, backgroundColor: theme.colors.outlineVariant }}/>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                      {aviso.message}
                    </Text>
                  </Card.Content>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', marginBottom: 16 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1 },
  infoText: { textAlign: 'center', marginTop: 32, fontSize: 16 },
  cardLayout: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 12, // Adiciona borderRadius ao layout do card
  },
  colorStripe: {
    width: 8,
  },
  cardContentContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});