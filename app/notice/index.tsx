import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Text, Chip, useTheme } from 'react-native-paper';

export default function QuadroAvisos() {
  const theme = useTheme();

  const avisos = [
    { id: 1, tipo: 'Eventos', cor: '#2F80ED', mensagem: 'Piscina reservada para festa dia 16/06 das 5h até 2h' },
    { id: 2, tipo: 'Urgente', cor: '#D32F2F', mensagem: 'Aviso urgente: manutenção elétrica dia 12/06' },
    { id: 3, tipo: 'Geral', cor: '#F2C94C', mensagem: 'Reunião geral no salão dia 15/06 às 18h' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header mode="center-aligned">
        <Appbar.Content title="Quadro de Avisos" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>Legenda</Text>
            <View style={styles.legendContainer}>
              <Chip style={[styles.legendChip, { backgroundColor: '#D32F2F' }]} textStyle={styles.legendText}>Urgente</Chip>
              <Chip style={[styles.legendChip, { backgroundColor: '#F2C94C' }]} textStyle={styles.legendText}>Geral</Chip>
              <Chip style={[styles.legendChip, { backgroundColor: '#BDBDBD' }]} textStyle={styles.legendText}>Manutenção</Chip>
              <Chip style={[styles.legendChip, { backgroundColor: '#2F80ED' }]} textStyle={styles.legendText}>Eventos</Chip>
            </View>
          </Card.Content>
        </Card>

        {avisos.map(aviso => (
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendChip: { paddingVertical: 4, paddingHorizontal: 8 },
  legendText: { color: '#fff' },
  colorBar: { width: 10, height: 40, borderRadius: 3, marginRight: 8 },
});