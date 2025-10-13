import { Drawer } from 'expo-router/drawer';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import CustomDrawerContent from '@/components/ui/CustomDrawerContent'; // CORREÇÃO 2
import { DrawerActions } from '@react-navigation/native'; // IMPORT ADICIONADO
import { DrawerContentComponentProps } from '@react-navigation/drawer';

export default function DrawerLayout() {
  const navigation = useNavigation();

  return (
    <Drawer
      // Adicionamos o tipo aos props para o TS ficar feliz
      drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 1,
          shadowOpacity: 0.1,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerLeft: () => (
          <TouchableOpacity 
            // CORREÇÃO 3
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ marginLeft: 15 }}
          >
            <Feather name="menu" size={24} color="#333" />
          </TouchableOpacity>
        ),
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: 'Tela Inicial',
        }}
      />
      <Drawer.Screen
        name="parking"
        options={{
          title: 'Parking',
        }}
      />
    </Drawer>
  );
}