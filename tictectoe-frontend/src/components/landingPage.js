import React, { useState, useRef } from "react";
import { useNavigation } from '@react-navigation/native';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image

} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles/landingPageStyles.js";
import tw from 'twrnc';
const LandingPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation();


  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    backgroundColors: isDarkMode ? ["#064E41", "#57B360"] : ["#064E41", "#57B360"],
    textColor: isDarkMode ? "#000000" : "#FFFFFF",
    buttonColor: isDarkMode ? "#57B360" : "#57B360",
    buttonTextColor: "#FFFFFF",
    switchTrackColor: isDarkMode ? "#81b0ff" : "#767577",
    switchThumbColor: isDarkMode ? "#57B360" : "#f4f3f4",
  };

  return (
    <LinearGradient
      colors={theme.backgroundColors}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={tw`justify-center flex-row mt-20`}>
          <Image
            source={require('../../assets/Logo-Transparent.png')}
            style={tw`w-30 h-30 self-center -mt-10 -mx-7`}
          />
          <Text style={tw`font-bold text-3xl mb-5 text-white `}>Tic Tec Toe</Text>
          <Switch
            style={tw`mt-1 ml-10 mr--13`}
            trackColor={{ false: "#767577", true: "#84cc16" }}
            onValueChange={toggleDarkMode}
            value={isDarkMode}
            ios_backgroundColor={"white"}
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textColor }]}>Research & Connection made easy.</Text>
          <Text style={[styles.description, { color: theme.textColor }]}>
            Discover papers, listen to summaries & connect with other students
          </Text>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonColor }]}
            onPress={() => navigation.navigate("AuthenticationSignUpPage")}>
            <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonColor }]}
            onPress={() => navigation.navigate("AuthenticationSignInPage")}>
            <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textColor }]}>Access to thousands of papers</Text>
          <Text style={[styles.footerText, { color: theme.textColor }]}>Personalized experience</Text>
          <Text style={[styles.footerText, { color: theme.textColor }]}>Discover & Connect</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};
export default LandingPage;

