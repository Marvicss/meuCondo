import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

type CustomHeaderProps = React.ComponentProps<typeof Appbar.Header>;

const CustomHeader = ({ children, style, ...props }: CustomHeaderProps) => {
  const theme = useTheme();

  const validChildren = React.Children.toArray(children).filter((child) =>
    React.isValidElement(child)
  );

  return (
    <Appbar.Header
      style={[
        styles.headerComSombra,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
      {...props}
    >
      {validChildren}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  headerComSombra: {
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    // Sombra para Android
    elevation: 5,
    
    borderBottomWidth: 0,
    zIndex: 1,
  },
});

export default CustomHeader;