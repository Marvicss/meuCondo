import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Inicio() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MeuCondo</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/login')}>
        <Text style={styles.buttonText}>Começar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E80FF', // azul vibrante
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFD43B', // amarelo
    marginBottom: 120,
  },
  button: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#FFD43B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  buttonText: {
    color: '#2E80FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
