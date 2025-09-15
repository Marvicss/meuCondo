import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function Inicio() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, colorScheme === 'light' && { fontFamily: 'System', fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }]}>MeuCondo</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/login')}>
        <Text style={styles.buttonText}>Começar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0095FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFD43B',
    marginBottom: 120,
  },
  button: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  buttonText: {
    color: '#0095FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
