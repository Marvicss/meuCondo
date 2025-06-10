// app/(tabs)/QuadroAvisos.tsx

import React, { useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Text, Chip, useTheme } from 'react-native-paper';

export default function QuadroAvisos() {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState('Todos');

  const avisos = [
    { id: 1, tipo: 'Eventos', cor: '#2F80ED', mensagem: 'Piscina reservada para festa dia 16/06 das 5h até 2h' },
    { id: 2, tipo: 'Urgente', cor: '#D32F2F', mensagem: 'Aviso urgente: manutenção elétrica dia 12/06' },
    { id: 3, tipo: 'Geral', cor: '#F2C94C', mensagem: 'Reunião geral no salão dia 15/06 às 18h' },
    { id: 4, tipo: 'Manutenção', cor: '#BDBDBD', mensagem: 'Reparo de vazamento no Bloco C dia 10/06' },
  ];

  const filteredAvisos = avisos.filter(aviso => {
    if (selectedType === 'Todos') {
      return true;
    }
    return aviso.tipo === selectedType;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header mode="center-aligned">
        <Appbar.Content title="Quadro de Avisos" />
      </Appbar.Header>

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

        {filteredAvisos.map(aviso => (
          <Card key={aviso.id} style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
            <Card.Title
              title={aviso.tipo}
              left={() => <View style={[styles.colorBar, { backgroundColor: aviso.cor }]} />}
            />
            <Card.Content>
              <Text variant="bodyMedium">{aviso.mensagem}</Text>
            </Card.Content>
          </Card>
        ))}

        {filteredAvisos.length === 0 && (
          <Text style={styles.noAvisosText}>Nenhum aviso encontrado para o tipo "{selectedType}".</Text>
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
    // Adicione um background para visualizar o container
    // backgroundColor: 'pink',
  },
  legendChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    elevation: 2,
    // Adicione uma borda para visualizar cada chip
    // borderWidth: 1,
    // borderColor: 'purple',
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
});