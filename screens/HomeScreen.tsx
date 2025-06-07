import React from "react";
import { View, TextInput, StyleSheet, SafeAreaView } from "react-native";
import NavBar from "../components/NavBar"; // adjust path as needed

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <NavBar title="Silens" />

      <TextInput
        style={styles.noteInput}
        placeholder="Start writing..."
        placeholderTextColor="#aaa"
        multiline
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000FF",
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFFFF",
    padding: 24,
    textAlignVertical: "top",
  },
});
