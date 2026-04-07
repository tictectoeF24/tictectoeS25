import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  Alert, Image, Switch, ScrollView
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setNewPassword1 } from "../../api";

const SetNewPasswordPage = () => {
  // 🔹 hooks FIRST, unconditionally
  const navigation = useNavigation();
  const route = useRoute();

  const [emailState, setEmailState] = useState(route?.params?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [switchEnabled, setSwitchEnable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false, uppercase: false, specialChar: false, number: false,
  });

  // Fallback to storage if param missing (e.g., web refresh)
  useEffect(() => {
    const loadEmail = async () => {
      if (!emailState) {
        const fromStorage = (await AsyncStorage.getItem("resetEmail")) || "";
        setEmailState(fromStorage.trim().toLowerCase());
      }
    };
    loadEmail();
  }, [emailState]);

  const togglePageTheme = () => setSwitchEnable(v => !v);

  const backgroundColors = switchEnabled ? ["#0C1C1A", "#2B5A3E"] : ["#064E41", "#3D8C45"];
  const textColor = switchEnabled ? "text-white" : "text-black";
  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";

  const updatePasswordRequirements = (p) => {
    setPasswordRequirements({
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      specialChar: /[@#$%&*]/.test(p),
      number: /[0-9]/.test(p),
    });
  };

  const handlePasswordChange = (v) => {
    setNewPassword(v);
    updatePasswordRequirements(v);
  };

  const validatePassword = (p) => {
    if (p.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(p)) return "Password must contain at least one uppercase letter.";
    if (!/[@#$%&*]/.test(p)) return "Password must contain at least one special character (@, #, $, %, &, *).";
    if (!/[0-9]/.test(p)) return "Password must contain at least one number.";
    return "";
  };

  const handleSetPassword = async () => {
    if (!emailState) {
      Alert.alert("Error", "Missing email. Please request a new code.");
      navigation.replace("RequestResetPasswordPage");
      return;
    }
    if (!newPassword) {
      Alert.alert("Error", "Please enter your new password");
      return;
    }
    const err = validatePassword(newPassword);
    if (err) return Alert.alert("Error", err);

    try {
      const resp = await setNewPassword1(emailState, newPassword);
      if (resp?.message) {
        // ✅ Now it’s safe to clear the stored email
        await AsyncStorage.removeItem("resetEmail");
        Alert.alert("Success", resp.message);
        navigation.navigate("AuthenticationSignInPage");
      } else {
        throw new Error("No response message from the server");
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to reset password");
    }
  };

  return (
    <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
      <ScrollView contentContainerStyle={tw`flex-grow`}>
        <LinearGradient colors={backgroundColors} style={tw`flex flex-1 flex-col h-full w-full py-10 items-center`}>
          <View style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}>
            <View style={tw`flex-row justify-center items-center mb-6 mt--12`}>
              <View style={tw`flex-row items-center`}>
                <Image source={require("../../assets/Logo-Transparent.png")} style={tw`w-20 h-20 mr--5`} />
                <Text style={tw`font-bold text-3xl ${textColor} ml-2 mr-12`}>Tic Tec Toe</Text>
              </View>
              <Switch trackColor={{ false: "#767577", true: "#84cc16" }} onValueChange={togglePageTheme}
                      value={switchEnabled} ios_backgroundColor="white" style={tw`mr--13`} />
            </View>

            {/* Title / instructions */}
            <Text style={tw`font-bold text-4xl ${textColor} mb-4 w-80 text-center`}>Set New Password</Text>
            <Text style={tw`mb-3 text-base text-center w-96 leading-tight ${textColor}`}>
              {emailState ? `Enter your new password for ${emailState}` : "Retrieving your email…"}
            </Text>

            {/* Input */}
            <View>
              <View style={tw`flex-row items-center rounded-md mb-2 ${inputBgColor}`}>
                <TextInput
                  style={tw`w-90 h-18 p-4 ${inputTextColor}`}
                  placeholder="Enter new password"
                  onChangeText={handlePasswordChange}
                  value={newPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={switchEnabled ? "#999" : "#666"}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={tw`pr-4`}>
                  <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="gray" />
                </TouchableOpacity>
              </View>

              {newPassword ? (
                <View style={tw`mb-4`}>
                  <Text style={tw`font-bold mb-1 ${textColor}`}>Password requirements:</Text>
                  <Text style={tw`${passwordRequirements.length ? "text-teal-300" : "text-amber-200"}`}>
                    {passwordRequirements.length ? "✓" : "×"} At least 8 characters long
                  </Text>
                  <Text style={tw`${passwordRequirements.uppercase ? "text-teal-300" : "text-amber-200"}`}>
                    {passwordRequirements.uppercase ? "✓" : "×"} One uppercase letter
                  </Text>
                  <Text style={tw`${passwordRequirements.specialChar ? "text-teal-300" : "text-amber-200"}`}>
                    {passwordRequirements.specialChar ? "✓" : "×"} One special character
                  </Text>
                  <Text style={tw`${passwordRequirements.number ? "text-teal-300" : "text-amber-200"}`}>
                    {passwordRequirements.number ? "✓" : "×"} One number
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[tw`mt-6 mb-1 w-70 h-16 shadow-lg rounded-lg items-center justify-center`, { backgroundColor: "#57B360" }]}
              onPress={handleSetPassword}
            >
              <Text style={tw`font-bold text-lg ${textColor}`}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SetNewPasswordPage;