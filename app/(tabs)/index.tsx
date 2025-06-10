import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const checkUserLoggedIn = async (): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500)); 
  const isLoggedIn = false; 
  console.log("Status de Login (simulado):", isLoggedIn);
  return isLoggedIn; 
};

export default function AppRootIndex() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuthStatus = async () => {
      const loggedIn = await checkUserLoggedIn();
      setIsUserAuthenticated(loggedIn);
      setIsLoading(false);
    };

    verifyAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  if (isUserAuthenticated) {
    console.log("Redirecionando para / (tabs)");
    return <Redirect href="/(tabs)" />; 
  } else {
    console.log("Redirecionando para /login");
    return <Redirect href="/login" />; 
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
  },
});
