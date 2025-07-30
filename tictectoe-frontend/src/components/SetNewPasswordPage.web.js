
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Switch,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { setNewPassword1 } from "../../api";

const SetNewPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const navigation = useNavigation();
  const route = useRoute();

  const { email } = route.params || {}; // Safely destructure email

  if (!email) {
    console.error("Email is missing! Check initialParams.");
    return (
      <SafeAreaView>
        <Text style={{ fontSize: 24, textAlign: "center", marginTop: 50 }}>
          Error: Email is missing. Please navigate to this page properly.
        </Text>
      </SafeAreaView>
    );
  }

  const [switchEnabled, setSwitchEnable] = useState(false); // Dark mode state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
    number: false,
  });

  // Function to toggle dark mode
  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  // Dynamic colors for dark and light modes
  const backgroundColors = switchEnabled
    ? ["#0C1C1A", "#2B5A3E"] // Dark mode gradient
    : ["#064E41", "#3D8C45"]; // Light mode gradient
  const textColor = switchEnabled ? "text-white" : "text-black";
  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";

  const updatePasswordRequirements = (password) => {
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      specialChar: /[@#$%&*]/.test(password),
      number: /[0-9]/.test(password),
    });
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    updatePasswordRequirements(value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[@#$%&*]/.test(password)) {
      return "Password must contain at least one special character (@, #, $, %, &, *).";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }
    return "";
  };

  const handleSetPassword = async () => {
    if (!newPassword) {
      Alert.alert("Error", "Please enter your new password");
      return;
    }

    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      Alert.alert("Error", passwordValidationError);
      return;
    }

    try {
      const response = await setNewPassword1(email, newPassword);
      if (response && response.message) {
        Alert.alert("Success", response.message);
        navigation.navigate("AuthenticationSignInPage");
      } else {
        throw new Error("No response message from the server");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to reset password");
    }
  };

  return (
    <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
      <ScrollView contentContainerStyle={tw`flex-grow`}>
        <LinearGradient
          colors={backgroundColors} // Dynamic gradient background
          // style={tw`flex flex-1 flex-col h-full w-full py-14 items-center`}
          style={tw`flex flex-1 flex-col h-full w-full py-10 items-center`}
        >
          <View
            style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}
          >
            {/* Header with Dark Mode Toggle */}
            <View style={tw`flex-row justify-center items-center mb-6 mt--12`}>
              <View style={tw`flex-row items-center`}>
                <Image
                  source={require("../../assets/Logo-Transparent.png")}
                  style={tw`w-20 h-20 mr--5`}
                />
                <Text style={tw`font-bold text-3xl ${textColor} ml-2 mr-12`}>
                  Tic Tec Toe
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#84cc16" }}
                onValueChange={togglePageTheme}
                value={switchEnabled}
                ios_backgroundColor="white"
                style={tw`mr--13`}
              />
            </View>

            {/* Title and Instructions */}
            {/* <Text style={tw`font-bold text-3xl ${textColor} mb-5 w-80 text-center`}> */}
            <Text style={tw`font-bold text-4xl ${textColor} mb-4 w-80 text-center`}>
              Set New Password
            </Text>
            {/* <Text style={tw`${textColor} mb-3 text-base text-center`}> */}
            {/* <Text style={tw`${textColor} mb-3 text-base text-center`}> */}
            {/* <Text style={tw`font-bold text-4xl ${textColor} mb-5 w-72 text-center`}> */}
            <Text style={tw`font-bold text-3x1 ${textColor} mb-3 text-base text-center w-96 leading-tight`}>
              Enter your new password for {email}
            </Text>

            {/* Password Input */}
            <View>
              <View
                style={tw`flex-row items-center rounded-md mb-2 ${inputBgColor}`}
              >
                <TextInput
                  style={tw`w-90 h-18 p-4 ${inputTextColor}`}
                  placeholder="Enter new password"
                  onChangeText={handlePasswordChange}
                  value={newPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={switchEnabled ? "#999" : "#666"}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={tw`pr-4`}>
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={24}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Requirements */}
              {newPassword && (
                <View style={tw`text-align:left mb-4`}>
                  <Text style={tw`font-bold mb-1 ${textColor}`}>
                    Password requirements:
                  </Text>
                  <Text
                    style={tw`${passwordRequirements.length ? "text-teal-300" : "text-amber-200"
                      }`}
                  >
                    {passwordRequirements.length ? "✓" : "×"} At least 8 characters long
                  </Text>
                  <Text
                    style={tw`${passwordRequirements.uppercase ? "text-teal-300" : "text-amber-200"
                      }`}
                  >
                    {passwordRequirements.uppercase ? "✓" : "×"} One uppercase letter
                  </Text>
                  <Text
                    style={tw`${passwordRequirements.specialChar
                      ? "text-teal-300"
                      : "text-amber-200"
                      }`}
                  >
                    {passwordRequirements.specialChar ? "✓" : "×"} One special character
                  </Text>
                  <Text
                    style={tw`${passwordRequirements.number ? "text-teal-300" : "text-amber-200"
                      }`}
                  >
                    {passwordRequirements.number ? "✓" : "×"} One number
                  </Text>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                tw`mt-6 mb-1 w-70 h-16 shadow-lg rounded-lg flex items-center justify-center`,
                { backgroundColor: "#57B360" },
              ]}
              onPress={handleSetPassword}
            >
              <Text style={tw`font-bold text-lg ${textColor}`}>
                Reset Password
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SetNewPasswordPage;

