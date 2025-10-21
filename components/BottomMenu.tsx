
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ICON_COLOR_INACTIVE = '#A0A0A0';
const ICON_COLOR_ACTIVE = '#FFFFFF'; 
const ICON_BG_ACTIVE = '#0095FF';   

const BottomMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();


  const menuItems = [
    { route: '/home', icon: <Feather name="home" size={28} />, key: 'home' },
    { route: '/prestacao-morador', icon: <Ionicons name="cash-outline" size={28} />, key: 'cash' },
    { route: '/notice', icon: <Feather name="bell" size={28} />, key: 'notice' },
    { route: '/reservas/morador', icon: <Ionicons name="checkmark-done-outline" size={28} />, key: 'reservas' },
    { route: '/parking', icon: <Ionicons name="calendar-outline" size={28} />, key: 'parking' },
  ];

 
  const getActiveIconName = (name: string) => {
    return name.replace('-outline', '');
  };

  return (
    <View style={styles.container}>
      {menuItems.map(item => {
        const isActive = pathname === item.route;
        
        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => router.push(item.route as any)}
            style={styles.tabButton}
          >
            {/* 3. Uma View extra cria o círculo de fundo azul apenas para o ícone ativo */}
            <View style={isActive ? styles.activeIconContainer : null}>
              {React.cloneElement(item.icon, {
                color: isActive ? ICON_COLOR_ACTIVE : ICON_COLOR_INACTIVE,
                name: isActive ? getActiveIconName(item.icon.props.name) : item.icon.props.name,
              })}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 70,
    borderRadius: 20,
    // Sombra
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: ICON_BG_ACTIVE,
    padding: 12,
    borderRadius: 30, 
  },
});

export default BottomMenu;