import { useRouter } from 'expo-router';
// 1. Importe o componente 'Image'
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';

export default function Inicio() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 2. Troque o <Text> pela sua <Image> */}
      <Image
        source={require('../assets/images/Logo.png')} // Caminho para a sua imagem
        style={styles.logo}
      />

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
  // 3. Crie um estilo para a logo
  logo: {
    width: 350, // Defina a largura
    height: 200, // Defina a altura
    resizeMode: 'contain', // Garante que a logo não seja cortada
    marginBottom: 120,
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