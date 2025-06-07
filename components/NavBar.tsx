import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NavBarProps {
  title?: string;
}

const NavBar: React.FC<NavBarProps> = ({ title = "Silens" }) => {
  return (
    <View style={styles.nav}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default NavBar;

const styles = StyleSheet.create({
  nav: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#000000FF',
    borderBottomWidth: 1,
    borderBottomColor: '#000000FF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#B69DDDFF',
  },
});