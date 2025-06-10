import { FontAwesome } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

const COLORS = {
  primaryBlue: '#2F80ED',
  primaryYellow: '#F2C94C',
  textPrimary: '#333333',
  textSecondary: '#828282',
  backgroundLight: '#F9F9F9',
  white: '#FFFFFF',
};

const API_BASE_URL = 'https://meu-condo.vercel.app';

export default function ParkingEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchParkingDetails = async () => {
      setLoading(true);
      try {
        const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZTYyOTEwYy1lYjM4LTQ0ZDYtOWQyNi1mZjg3OTQ0MWExNzciLCJlbWFpbCI6ImJtZm1sdWNhc0BnbWFpbC5jb20iLCJ1c2VyVHlwZSI6IkFETUlOIiwiaWF0IjoxNzQ5NTczNzgyLCJleHAiOjE3NDk2NjAxODJ9.jX6sy1gm4rCybfpVbK_4MuqE1Uet_arm5TU4uHkBX_A";
        
        const response = await fetch(`${API_BASE_URL}/parkings/${id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });

        if (!response.ok) throw new Error('Falha ao buscar dados da vaga para edição.');
        
        const data = await response.json();
        setName(data.name);
        setDescription(data.description);
      } catch (e) {
        Alert.alert("Erro", "Não foi possível carregar os dados para edição.");
      } finally {
        setLoading(false);
      }
    };

    fetchParkingDetails();
  }, [id]);

  const handleUpdate = async () => {
    if (!name) {
      Alert.alert("Campo obrigatório", "O nome da vaga não pode ficar em branco.");
      return;
    }
    setSaving(true);
    try {
      const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZTYyOTEwYy1lYjM4LTQ0ZDYtOWQyNi1mZjg3OTQ0MWExNzciLCJlbWFpbCI6ImJtZm1sdWNhc0BnbWFpbC5jb20iLCJ1c2VyVHlwZSI6IkFETUlOIiwiaWF0IjoxNzQ5NTczNzgyLCJleHAiOjE3NDk2NjAxODJ9.jX6sy1gm4rCybfpVbK_4MuqE1Uet_arm5TU4uHkBX_A";
      const body = JSON.stringify({ name, description });

      const response = await fetch(`${API_BASE_URL}/parkings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Falha ao atualizar a vaga.");
      }

      Alert.alert("Sucesso!", "Vaga atualizada com sucesso.");
      router.back();
    } catch (e: any) {
      Alert.alert("Erro ao Salvar", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ flex: 1 }} />;
  }

  return (
    <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
            <Stack.Screen options={{ title: `Editando Vaga` }} />

            <Text style={styles.label}>Nome da Vaga</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Vaga 101"
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Coberta, perto do elevador"
                multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={saving}>
                {saving ? (
                <ActivityIndicator color={COLORS.textPrimary} />
                ) : (
                <>
                    <FontAwesome name="save" size={18} color={COLORS.textPrimary} />
                    <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                </>
                )}
            </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 20,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primaryYellow,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    }
});
