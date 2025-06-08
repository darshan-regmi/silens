import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

type IconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  label: string;
  icon: IconName;
  action: () => void;
}

const menuItems: MenuItem[] = [
  { label: "New Note", icon: "create-outline", action: () => console.log("New Note") },
  { label: "My Notes", icon: "book-outline", action: () => console.log("My Notes") },
  { label: "Search", icon: "search-outline", action: () => console.log("Search") },
  { label: "Settings", icon: "settings-outline", action: () => console.log("Settings") },
];

export default function Sidebar() {
  const [slideAnim] = useState(new Animated.Value(-screenWidth));
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? -screenWidth : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Icon */}
      <TouchableOpacity onPress={toggleSidebar} style={styles.hamburger}>
        <Ionicons name={isOpen ? "close" : "menu"} size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {menuItems.map(({ label, icon, action }) => (
          <TouchableOpacity
            key={label}
            onPress={() => {
              action();
              toggleSidebar();
            }}
            style={styles.menuItem}
          >
            <Ionicons name={icon} size={22} color="#CCCCCC" />
            <Text style={styles.menuLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth * 0.75,
    height: "100%",
    backgroundColor: "#111111",
    paddingTop: 100,
    paddingHorizontal: 24,
    zIndex: 9,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  menuLabel: {
    fontSize: 18,
    marginLeft: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});