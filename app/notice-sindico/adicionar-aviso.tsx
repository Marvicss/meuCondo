import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import { Chevron } from 'react-native-shapes';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const AdicionarAvisoScreen = () => {
  const router = useRouter();
  
  // Estados para os campos do formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);

  // Estados para o seletor de data e hora
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // No iOS o picker fica visível
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShowPicker(true);
    setPickerMode(currentMode);
  };

  const handlePublicar = async () => {
    // 1. Validação simples
    if (!titulo.trim() || !descricao.trim() || !categoria) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // 2. Montar o objeto para enviar ao backend
    const novoAviso = {
      titulo,
      descricao,
      data: date.toLocaleDateString('pt-BR'), // Formato "dd/mm/yyyy"
      horario: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), // Formato "HH:MM"
      categoria,
    };

    console.log('Enviando para o backend:', novoAviso);

    try {
      // 3. Enviar para a API
      // const response = await fetch('https://sua-api.com/avisos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(novoAviso),
      // });

      // if (!response.ok) {
      //   throw new Error('Falha ao publicar o aviso.');
      // }

      Alert.alert('Sucesso!', 'Seu aviso foi publicado.', [
        { text: 'OK', onPress: () => router.back() }, // Volta para a tela anterior
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível publicar o aviso.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Manutenção do Elevador"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva os detalhes do aviso aqui..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Data</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => showMode('date')}>
              <Text style={styles.datePickerText}>{date.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => showMode('time')}>
              <Text style={styles.datePickerText}>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
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

          <Text style={styles.label}>Categoria</Text>
          <RNPickerSelect
            onValueChange={(value) => setCategoria(value)}
            placeholder={{ label: 'Selecione uma categoria', value: null }}
            items={[
              { label: 'Manutenção', value: 'manutencao' },
              { label: 'Eventos', value: 'eventos' },
              { label: 'Comunicados Gerais', value: 'geral' },
            ]}
            value={categoria}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            Icon={() => <Chevron size={1.5} color="gray" />}
          />

          <TouchableOpacity style={styles.publishButton} onPress={handlePublicar}>
            <Text style={styles.publishButtonText}>Publicar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


// --- Estilos ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F5F7' },
    container: { flexGrow: 1, padding: 20, backgroundColor: '#F4F5F7' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 16 },
    input: {
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#DDE3E9',
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      color: '#333',
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    datePickerButton: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#DDE3E9',
      paddingVertical: 12,
      alignItems: 'center',
      marginRight: 10,
    },
    datePickerText: {
      fontSize: 16,
      color: '#333',
    },
    publishButton: {
      backgroundColor: '#0095FF',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 30,
    },
    publishButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1,
      borderColor: '#DDE3E9', borderRadius: 8, color: 'black', paddingRight: 30,
      backgroundColor: 'white',
    },
    inputAndroid: {
      fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1,
      borderColor: '#DDE3E9', borderRadius: 8, color: 'black', paddingRight: 30,
      backgroundColor: 'white',
    },
    iconContainer: { top: Platform.OS === 'ios' ? 15 : 20, right: 15 },
    placeholder: { color: '#999' },
});

export default AdicionarAvisoScreen;