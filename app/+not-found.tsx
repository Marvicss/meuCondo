// app/+not-found.tsx

import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

// Verifique se os caminhos destes imports estão corretos
// Se eles também derem erro, troque por caminhos relativos, como '../components/ThemedText'
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        
        {/* ======================================================= */}
        {/* ## A CORREÇÃO ESTÁ AQUI ##                            */}
        {/* Apontamos o link para a nova tela inicial de verdade. */}
        {/* ======================================================= */}
        <Link href="/reservas/morador" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});