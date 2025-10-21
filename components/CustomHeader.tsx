import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

type CustomHeaderProps = React.ComponentProps<typeof Appbar.Header>;

const CustomHeader = (props: CustomHeaderProps) => {
  const theme = useTheme();

  return (
    <Appbar.Header

      style={[
        styles.headerComSombra,
        { backgroundColor: theme.colors.surface },
        props.style,
      ]}

      {...props} 
    >
      {/* Isso garante que o <Appbar.Content ... /> que você 
          passar dentro dele seja renderizado */}
      {props.children}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  headerComSombra: {
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2, // Sombra para baixo
    },
    shadowOpacity: 0.15, // Opacidade da sombra
    shadowRadius: 3.84,  // O "blur" (esfumaçado)
    
    // Sombra para Android
    elevation: 5,
  },
});

export default CustomHeader;