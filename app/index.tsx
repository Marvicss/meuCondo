import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Inicio() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MeuCondo</Text>
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
  brand: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 120,
    fontFamily: 'System',
  },
  button: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 2,
  },
  buttonText: {
    color: '#0095FF',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
});
