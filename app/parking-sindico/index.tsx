import BottomMenu from '@/components/BottomMenu';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- DEFINIÇÃO DE TIPOS ---
type ParkingSpace = {
  id: string;
  name: string; // Ex: "Vaga 1"
  isOccupied: boolean;
  condominiumId: string;
};

const ParkingScreen = () => {
  const theme = useTheme();
  const router = useRouter();

  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect para buscar os dados sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      const fetchParkingData = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            router.replace('/login');
            return;
          }

          // **IMPORTANTE**: Substitua pela sua URL de API real para buscar as vagas
          const response = await fetch(`https://meu-condo.onrender.com/parkings/`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            setParkingSpaces(data);
          } else {
            console.log("Falha ao buscar dados da API. Usando dados de exemplo.");
            setParkingSpaces(mockData); 
          }

        } catch (err) {
          Alert.alert("Erro", "Falha na comunicação com o servidor. Usando dados de exemplo.");
          setParkingSpaces(mockData);
        } finally {
          setLoading(false);
        }
      };

      fetchParkingData();
    }, [router])
  );

  const handleRemovePerson = (spaceId: string) => {
    // Lógica para chamar a API e desocupar a vaga
    Alert.alert(
      "Confirmar",
      `Deseja realmente remover a pessoa da vaga ${parkingSpaces.find(s => s.id === spaceId)?.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, remover", onPress: () => console.log(`Removendo da vaga ${spaceId}`) }
      ]
    );
  };

  const handleDeleteParking = async (spaceId: string, spaceName: string) => {
    Alert.alert(
      "Excluir Vaga",
      `Tem certeza que deseja excluir a vaga ${spaceName}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                router.replace('/login');
                return;
              }

              const response = await fetch(`https://meu-condo.onrender.com/parkings/${spaceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert("Sucesso", "Vaga excluída com sucesso!");
                // Atualiza a lista removendo a vaga excluída
                setParkingSpaces(prevSpaces => prevSpaces.filter(space => space.id !== spaceId));
              } else {
                Alert.alert("Erro", "Não foi possível excluir a vaga.");
              }
            } catch (error) {
              console.error("Erro ao excluir vaga:", error);
              Alert.alert("Erro", "Falha ao excluir a vaga.");
            }
          }
        }
      ]
    );
  };
  
  // Dados de exemplo para desenvolvimento (enquanto a API não está pronta)
  const mockData: ParkingSpace[] = [
    { id: '1', name: 'Vaga 1', isOccupied: false, condominiumId: '1' },
    { id: '2', name: 'Vaga 2', isOccupied: false, condominiumId: '1' },
    { id: '3', name: 'Vaga 3', isOccupied: true, condominiumId: '1' },
  ];


  if (loading) {
    return <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Estacionamento" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.container}>
        
        {/* Botão Cadastrar Vagas */}
        <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/parking-sindico/register-space')}>
            <Feather name="plus" size={24} color="#fff" />
            <Text style={styles.registerButtonText}>Cadastrar vagas</Text>
        </TouchableOpacity>

        {/* TÍTULO COM SOMBRA APLICADA */}
        <View style={[styles.titleContainerWithShadow, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Gerenciar Vagas</Text>
        </View>

        {parkingSpaces.map((space) => (
            <View key={space.id} style={[styles.card, {backgroundColor: theme.colors.surface}, space.isOccupied && styles.cardOccupied]}>
                
                {space.isOccupied && <View style={styles.occupiedIndicator} />}

                {/* Botão de excluir no canto superior direito */}
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={() => handleDeleteParking(space.id, space.name)}
                >
                  <Feather name="trash-2" size={20} color="#FF453A" />
                </TouchableOpacity>

                <FontAwesome5 name="car-alt" size={48} color="#0099FF" style={styles.cardIcon}/>
                
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{space.name}</Text>
                
                {space.isOccupied ? (
                    <>
                        <Text style={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}>Alguém estacionado no momento</Text>
                        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemovePerson(space.id)}>
                            <Text style={styles.removeButtonText}>Remover pessoa da vaga</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>Disponível</Text>
                    </View>
                )}
            </View>
        ))}

        </ScrollView>
        <BottomMenu />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainContent: {
    flex: 1,
  },
  titleContainerWithShadow: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    
    // A Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  container: {
    padding: 20,
    paddingBottom: 120,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#0099FF',
    borderRadius: 16,
    paddingVertical: 18,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#0099FF',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
    overflow: 'hidden',
  },
  cardOccupied: {
    paddingTop: 30, // Espaço extra para o indicador
  },
  occupiedIndicator: {
    position: 'absolute',
    top: 10,
    right: 16,
    width: 24,
    height: 6,
    backgroundColor: '#FF453A', // Vermelho
    borderRadius: 3,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 12,
    zIndex: 10,
    elevation: 2,
    shadowColor: '#FF453A',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#34C75920', // Verde com opacidade
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusBadgeText: {
    color: '#34C759', // Verde
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  removeButton: {
    backgroundColor: '#0099FF',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ParkingScreen;