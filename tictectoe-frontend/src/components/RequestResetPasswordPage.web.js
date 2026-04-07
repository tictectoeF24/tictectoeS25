
// import React, {useEffect, useState } from "react";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { requestResetPassword } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RequestResetPasswordPage = () => {
  const [email, setEmail] = useState(""); // Tracks the email input value
  const [switchEnabled, setSwitchEnable] = useState(false); // Tracks the dark mode toggle
  const navigation = useNavigation();
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 1️⃣ Added toggle function to handle dark mode
  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  useEffect(() => {
  AsyncStorage.removeItem("resetEmail"); // start fresh
}, []);

const handleResetPassword = async () => {
  setEmailError("");
  setSuccessMessage("");

  if (!email) {
    setEmailError("Please enter your email address");
    return;
  }

  try {
    setLoading(true);
    const normalized = email.trim().toLowerCase();

    await requestResetPassword(normalized);

    // persist for Verify screen fallback
    await AsyncStorage.setItem("resetEmail", normalized);

    setSuccessMessage("OTP sent! Check your email.");
    setTimeout(() => {
      navigation.navigate("VerifyResetOtpPage", { email: normalized });
    }, 800);
  } catch (error) {
    const msg = (error?.message || "").toLowerCase();
    if (msg.includes("user not found")) {
      setEmailError("No account found with this email.");
    } else {
      setEmailError("Failed to send OTP. Try again.");
    }
  } finally {
    setLoading(false);
  }
};

  // Dynamic Background Colors for LinearGradient
  const backgroundColors = switchEnabled
    ? ["#0C1C1A", "#2B5A3E"] // Dark mode colors
    : ["#064E41", "#3D8C45"]; // Light mode colors

  return (
    <LinearGradient
      colors={backgroundColors} // Dynamic gradient colors for dark/light mode
      style={tw`flex flex-1 flex-col h-full w-full py-14 items-center`}
    >
      <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
        <ScrollView contentContainerStyle={tw`flex-grow`}>
          <View
            style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}
          >
            {/* Updated: Logo and dark mode switch */}
            <View style={tw`flex-row justify-center items-center mb-6 mt--12`}>
              <View style={tw`flex-row items-center`}>
                <Image
                  source={require("../../assets/Logo-Transparent.png")}
                  style={tw`w-20 h-20 mr--5`}
                />
                <Text
                  style={tw`font-bold text-3xl text-white ml-2 mr-12`}
                >
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
            <Text
              style={tw`font-bold text-3xl text-white mt-10 mb-5`}
            >
              Reset Password
            </Text>
            <Text
              style={tw`text-white mb-3 text-base text-center`}
            >
              Enter the email associated with your account to reset your password
            </Text>

            {/* Updated: TextInput styles for dark mode */}
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
            {/* Inline feedback lives directly under the input */}
            {emailError !== "" && (
              <Text style={[tw`mt-2`, { color: "#ffb4b4", fontSize: 14 }]}>
                {emailError}
              </Text>
            )}

            {successMessage !== "" && (
              <Text style={[tw`mt-2`, { color: "#b6ffb4", fontSize: 14 }]}>
                {successMessage}
              </Text>
            )}
            <TouchableOpacity
              style={[
                tw`mt-8 mb-1 w-60 h-15 shadow-lg rounded-lg flex items-center justify-center`,
                { backgroundColor: "#57B360" },
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text
                style={tw`font-bold text-lg ${switchEnabled ? "text-black" : "text-white"}`}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default RequestResetPasswordPage;

