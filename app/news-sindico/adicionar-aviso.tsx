import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Condominium {
  id: string;
  name: string;
}

const AdicionarAvisoScreen = () => {
  const theme = useTheme();
  const router = useRouter();

  // Removido estado 'titulo'
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<string>('GENERAL');
  const [loading, setLoading] = useState(false);
  
  const [condominios, setCondominios] = useState<Condominium[]>([]);
  const [condominioSelecionado, setCondominioSelecionado] = useState<string>('');

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

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

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShowPicker(true);
    setPickerMode(currentMode);
  };

  const handlePublicar = async () => {
    // Removida validação de titulo
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
        // Como removemos o título, se o backend exigir um título, podemos usar:
        // title: descricao.substring(0, 20) + "...", 
        // Ou simplesmente não enviar nada se for opcional:
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
        <Appbar.Content title="Novo Aviso" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* Seletor de Condomínio */}
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

          {/* Campo Título foi REMOVIDO daqui */}

          {/* Descrição */}
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

          {/* Data */}
          <View style={styles.inputGroup}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 5 }}>
                Data e Hora
             </Text>
            <View style={styles.dateRow}>
                <Button 
                    mode="outlined" 
                    onPress={() => showMode('date')} 
                    style={{ flex: 1, marginRight: 8 }}
                    textColor={theme.colors.onSurface}
                >
                    {date.toLocaleDateString('pt-BR')}
                </Button>
                <Button 
                    mode="outlined" 
                    onPress={() => showMode('time')} 
                    style={{ flex: 1 }}
                    textColor={theme.colors.onSurface}
                >
                    {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Button>
            </View>
          </View>

          {showPicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={pickerMode}
              is24Hour={true}
              display="default"
              onChange={onChangeDate}
            />
          )}

          {/* Categoria */}
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

          <Button 
            mode="contained" 
            onPress={handlePublicar}
            loading={loading}
            disabled={loading}
            style={styles.publishButton}
            contentStyle={{ height: 50 }}
            labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
            buttonColor="#0095FF"
          >
            Publicar
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Estilos ---
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  publishButton: {
    borderRadius: 12,
    marginTop: 20,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
});

export default AdicionarAvisoScreen;