import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Appbar,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

interface Condominium {
  id: string;
  name: string;
}

// --- Ícone SVG para o botão (Check) ---
const IconCheck = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;

const AdicionarAvisoScreen = () => {
  const theme = useTheme();
  const router = useRouter();

  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<string>('GENERAL');
  const [loading, setLoading] = useState(false);
  
  const [condominios, setCondominios] = useState<Condominium[]>([]);
  const [condominioSelecionado, setCondominioSelecionado] = useState<string>('');

  useEffect(() => {
    const fetchCondominios = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`https://meu-condo.onrender.com/condominiums/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setCondominios(data);
            setCondominioSelecionado(data[0].id);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar condomínios:", error);
      }
    };
    fetchCondominios();
  }, []);

  const handlePublicar = async () => {
    if (!descricao.trim() || !categoria) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e selecione uma categoria.');
      return;
    }
    
    if (!condominioSelecionado) {
      Alert.alert('Erro', 'Selecione um condomínio para publicar o aviso.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Sessão Expirada", "Por favor, faça o login novamente para continuar.");
        router.replace('/login');
        return;
      }
      
      const novoAviso = {
        condominiumId: condominioSelecionado,
        type: categoria, 
        message: descricao,
      };

      const response = await fetch('https://meu-condo.onrender.com/news/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(novoAviso),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao publicar o aviso.');
      }

      Alert.alert('Sucesso!', 'Seu aviso foi publicado.', [
        { text: 'OK', onPress: () => router.back() },
      ]);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', error.message || 'Não foi possível publicar o aviso.');
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = '#0095FF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header Centralizado */}
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
        <Appbar.Content title="Novo Aviso" titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.inputGroup}>
             <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 5 }}>
                Condomínio
             </Text>
             <View style={[
                styles.pickerWrapper, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline 
                }
             ]}>
                <Picker
                  selectedValue={condominioSelecionado}
                  onValueChange={(itemValue) => setCondominioSelecionado(itemValue)}
                  style={{ color: theme.colors.onSurface }}
                  dropdownIconColor={theme.colors.onSurface}
                >
                   <Picker.Item label="Selecione..." value="" color="#666"/>
                   {condominios.map(condo => (
                     <Picker.Item key={condo.id} label={condo.name} value={condo.id} color="#000000"/>
                   ))}
                </Picker>
             </View>
          </View>

          <TextInput
            label="Descrição"
            mode="outlined"
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva os detalhes do aviso aqui..."
            multiline
            numberOfLines={4}
            style={styles.input}
            theme={{ colors: { background: theme.colors.surface } }}
          />

          {/* Data e Hora removidos daqui */}

          <View style={styles.inputGroup}>
             <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 5 }}>
                Categoria
             </Text>
             <View style={[
                styles.pickerWrapper, 
                { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline 
                }
             ]}>
                <Picker
                  selectedValue={categoria}
                  onValueChange={(itemValue) => setCategoria(itemValue)}
                  style={{ color: theme.colors.onSurface }}
                  dropdownIconColor={theme.colors.onSurface}
                >
                  <Picker.Item label="Geral" value="GENERAL" color="#000000"/>
                  <Picker.Item label="Urgente" value="URGENT" color="#000000"/>
                  <Picker.Item label="Manutenção" value="MAINTENANCE" color="#000000"/>
                  <Picker.Item label="Eventos" value="EVENTS" color="#000000"/>
                </Picker>
             </View>
          </View>

          {/* Botão Publicar Customizado */}
          <TouchableOpacity 
              style={[styles.publishButtonCustom, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]} 
              onPress={handlePublicar}
              activeOpacity={0.9}
              disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <SvgXml xml={IconCheck} width="20" height="20" style={{ marginRight: 8 }} />
                <Text style={styles.publishButtonTextCustom}>Publicar</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
  },
  input: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  publishButtonCustom: {
    borderRadius: 30, 
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    elevation: 2, 
    shadowColor: '#0095FF',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  publishButtonTextCustom: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500', 
  },
});

export default AdicionarAvisoScreen;