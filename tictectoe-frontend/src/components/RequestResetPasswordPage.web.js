
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { requestResetPassword } from "../../api";

const RequestResetPasswordPage = () => {
  const [email, setEmail] = useState(""); // Tracks the email input value
  const [switchEnabled, setSwitchEnable] = useState(false); // Tracks the dark mode toggle
  const navigation = useNavigation();

  // 1️⃣ Added toggle function to handle dark mode
  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  // 2️⃣ API call logic remains unchanged
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      await requestResetPassword(email); // Calls API to send OTP
      Alert.alert("Success", "An OTP has been sent to your email");
      navigation.navigate("VerifyResetOtpPage", { email });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    }
  };

  // 3️⃣ Dynamic Background Colors for LinearGradient
  const backgroundColors = switchEnabled
    ? ["#0C1C1A", "#2B5A3E"] // Dark mode colors
    : ["#064E41", "#3D8C45"]; // Light mode colors

  return (
    <LinearGradient
      colors={backgroundColors} // 4️⃣ Dynamic gradient colors for dark/light mode
      style={tw`flex flex-1 flex-col h-full w-full py-14 items-center`}
    >
      <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
        <ScrollView contentContainerStyle={tw`flex-grow`}>
          <View
            style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}
          >
            {/* 5️⃣ Updated: Logo and dark mode switch */}
            <View style={tw`flex-row justify-center items-center mb-6 mt--12`}>
              <View style={tw`flex-row items-center`}>
                <Image
                  source={require("../../assets/Logo-Transparent.png")}
                  style={tw`w-20 h-20 mr--5`}
                />
                <Text
                  style={tw`font-bold text-3xl ${switchEnabled ? "text-white" : "text-black" // Dynamic text color
                    } ml-2 mr-12`}>
                  Tic Tec Toe
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#84cc16" }}
                onValueChange={togglePageTheme} // Handles dark mode toggle
                value={switchEnabled}
                ios_backgroundColor="white"
                style={tw`mr--13`}
              />
            </View>

            {/* 6️⃣ Updated: Page title with dynamic color */}
            <Text
              style={tw`font-bold text-3xl ${switchEnabled ? "text-white" : "text-black" // Dynamic text color
                } mt-10 mb-5`}
            >
              Reset Password
            </Text>

            {/* 7️⃣ Updated: Instruction text with dynamic color */}
            <Text
              style={tw`${switchEnabled ? "text-white" : "text-black" // Dynamic text color
                } mb-3 text-base text-center`}
            >
              Enter the email associated with your account to reset your password
            </Text>

            {/* 8️⃣ Updated: TextInput styles for dark mode */}
            <TextInput
              style={tw`w-80 h-14 rounded-md mx-10 p-4 ${switchEnabled ? "bg-black text-white" : "bg-white text-black" // Dynamic input background and text color
                }`}
              placeholder="Enter your email"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              placeholderTextColor={switchEnabled ? "#999" : "#666"} // Dynamic placeholder color
              autoCapitalize="none"
            />

            {/* 9️⃣ Updated: Send OTP Button with consistent styling */}
            <TouchableOpacity
              style={[
                tw`mt-8 mb-1 w-60 h-15 shadow-lg rounded-lg flex items-center justify-center`,
                { backgroundColor: "#57B360" }, // Button color remains consistent
              ]}
              onPress={handleResetPassword}
            >
              <Text
                style={tw`font-bold text-lg ${switchEnabled ? "text-black" : "text-white" // Dynamic text color
                  }`}
              >
                Send OTP
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default RequestResetPasswordPage;

