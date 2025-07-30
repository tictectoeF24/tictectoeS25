import React, { useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles/landingPageStyles.js";
import tw from "twrnc";
const LandingPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    backgroundColors: isDarkMode
      ? ["#064E41", "#57B360"]
      : ["#064E41", "#57B360"],
    textColor: isDarkMode ? "#000000" : "#FFFFFF",
    buttonColor: isDarkMode ? "#57B360" : "#57B360",
    buttonTextColor: isDarkMode ? "#000000" : "#FFFFFF",
    switchTrackColor: isDarkMode ? "#81b0ff" : "#767577",
    switchThumbColor: isDarkMode ? "#57B360" : "#f4f3f4",
  };

  return (
    <LinearGradient colors={theme.backgroundColors} style={styles.container}>
      <ScrollView style={tw`flex flex-1`}>
        <View style={tw`justify-center flex-row mt-10`}>
          <Image
            source={require("../../assets/Logo-Transparent.png")}
            style={tw`w-30 h-30 self-center -mt-10 -mx-7`}
          />
          <Text style={tw`font-bold text-3xl mb-5 text-white `}>
            Tic Tec Toe
          </Text>
          <Switch
            style={tw`mt-1 ml-10 mr--13`}
            trackColor={{ false: "#767577", true: "#84cc16" }}
            onValueChange={toggleDarkMode}
            value={isDarkMode}
            ios_backgroundColor={"white"}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: theme.textColor },
              tw`text-5xl mb-10`,
            ]}
          >
            Research & Connection made easy.
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.textColor },
              tw`text-3xl mb-8`,
            ]}
          >
            Discover papers, listen to summaries & connect with other students &
            researchers
          </Text>
          <Text style={[tw`text-xl`, { color: theme.textColor }]}>
            Get started by downloading now!
          </Text>

          <View style={tw`flex flex-1 flex-col w-1/2 mx-auto`}>
            {/* App Store and GooglePlay Links */}
            <View
              style={tw`flex flex-row p-5 items-center justify-center gap-8`}
            >
              <Image
                source={require("../../assets/appstore.png")}
                style={tw`bg-transparent w-44 h-14 self-center mt-5 rounded-lg`}
              />

              <Image
                source={require("../../assets/googleplay.png")}
                style={tw`bg-transparent w-44 h-14 self-center mt-5 rounded-lg`}
              />
            </View>

            <View style={tw`flex flex-row gap-1 w-full justify-center items-center w-1/2 mx-auto`}>
              <View style={tw`border-t border-gray-300 my-8 w-full`} />
              <Text style={tw`text-gray-300`}>OR</Text>
              <View style={tw`border-t border-gray-300 my-8 w-full`} />
            </View>

            {/* Sign Up and Sign In Buttons */}
            <View
              style={tw`flex flex-row p-5 items-center justify-center gap-8 mb-4 w-1/2 mx-auto`}
            >
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.buttonColor }]}
                onPress={() => navigation.navigate("AuthenticationSignUpPage")}
              >
                <Text
                  style={[styles.buttonText, { color: theme.buttonTextColor }]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.buttonColor }]}
                onPress={() => navigation.navigate("AuthenticationSignInPage")}
              >
                <Text
                  style={[styles.buttonText, { color: theme.buttonTextColor }]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={tw`flex flex-row gap-12 mx-auto`}>
          <Text
            style={[styles.footerText, { color: theme.textColor }, tw`text-lg`]}
          >
            Access to thousands of papers
          </Text>
          <Text
            style={[styles.footerText, { color: theme.textColor }, tw`text-lg`]}
          >
            Personalized experience
          </Text>
          <Text
            style={[styles.footerText, { color: theme.textColor }, tw`text-lg`]}
          >
            Discover & Connect
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};
export default LandingPage;
