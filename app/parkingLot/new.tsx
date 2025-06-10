import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

export default function NewParkingLotScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!name) {
            Alert.alert("Campo obrigatório", "O nome da vaga é necessário.");
            return;
        }
        setSaving(true);
        try {
            const authToken = await AsyncStorage.getItem("token");
            const condominiumId = "9f743880-52dd-4b65-949d-0cdc726d4752";
            const body = JSON.stringify({ name, description, available: true, condominiumId });

            const response = await fetch(`${API_BASE_URL}/parkings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Falha ao criar vaga.");
            }

            Alert.alert("Sucesso", "Nova vaga criada!");
            router.back();
        } catch (e: any) {
            Alert.alert("Erro", e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{flex: 1}} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
                <Text style={styles.label}>Nome da Vaga</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: G-101"/>
                
                <Text style={styles.label}>Descrição</Text>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Ex: Coberta, perto do Bloco B" multiline />
                
                <TouchableOpacity style={styles.saveButton} onPress={handleCreate} disabled={saving}>
                    {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Criar Vaga</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: COLORS.backgroundLight },
    label: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
    input: { backgroundColor: COLORS.white, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, fontSize: 16, marginBottom: 20, borderColor: '#ddd', borderWidth: 1 },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveButton: { backgroundColor: COLORS.primaryBlue, padding: 15, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
