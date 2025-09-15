import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const ICON_COLOR = '#2F3A4B';
const ICON_ACTIVE_BG = '#0099FF';
const ICON_ACTIVE_COLOR = '#fff';

const BottomMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { route: '/home', icon: <Feather name="home" size={28} />, key: 'home' },
    { route: '/prestacao-morador', icon: <FontAwesome5 name="money-bill-wave" size={28} />, key: 'cash' },
    { route: '/notice', icon: <Feather name="volume-2" size={28} />, key: 'notice' },
    { route: '/reservas/morador', icon: <Ionicons name="checkmark-done-outline" size={28} />, key: 'reservas' },
    { route: '/parking', icon: <Ionicons name="calendar-outline" size={28} />, key: 'parking' },
  ];

  return (
    <View style={styles.container}>
      {menu.map(item => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity key={item.key} onPress={() => router.push(item.route as any)}>
            <View style={isActive ? styles.activeCircle : undefined}>
              {React.cloneElement(item.icon, {
                color: isActive ? ICON_ACTIVE_COLOR : ICON_COLOR,
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  activeCircle: {
    backgroundColor: ICON_ACTIVE_BG,
    borderRadius: 32,
    padding: 12,
  },
});

export default BottomMenu;