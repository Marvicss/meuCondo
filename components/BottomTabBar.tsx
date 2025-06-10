import { FontAwesome } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, View, StyleSheet, SafeAreaView } from 'react-native';

const COLORS = {
  primaryBlue: '#2F80ED',
  primaryYellow: '#F2C94C',
  white: '#FFFFFF',
  grey: '#BDBDBD',
};

const TABS = [
  { name: 'home', icon: 'home', href: '/home' },
  { name: 'accountabilities', icon: 'file-text-o', href: '/accountabilities' },
  { name: 'news', icon: 'bullhorn', href: '/news' },
  { name: 'parkingLot', icon: 'car', href: '/parkingLot' },
  { name: 'reservations', icon: 'calendar', href: '/reservations' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link key={tab.name} href={tab.href as any} asChild>
              <Pressable style={styles.tabItem}>
                <FontAwesome
                  name={tab.icon as any}
                  size={28}
                  color={isActive ? COLORS.primaryYellow : COLORS.white}
                />
              </Pressable>
            </Link>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.primaryBlue,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
