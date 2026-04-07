/*
 * @author Muhammad Shafay Zulfiqar
 * @date 20th Nov, 2025
 * Sign in page – user signs in with email + password,
 * can go to sign up, toggle dark mode, or reset password.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { signIn } from "../../api";

const AuthenticationSignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [switchEnabled, setSwitchEnable] = useState(false);
  const [signInError, setSignInError] = useState("");

  const navigation = useNavigation();

  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((previous) => !previous);
  };

  const handleSubmit = async () => {
    // clear any old inline error
    setSignInError("");

    if (!email || !password) {
      setSignInError("Email and password are required.");
      return;
    }

    try {
      const data = await signIn(email, password);

      // If backend says account is unverified, go to OTP screen
      if (data?.unverified) {
        const lower = (email || "").trim().toLowerCase();

        // same behaviour as web: simple alert then navigate to OTP verify
        alert(
            data.resent
                ? "We just sent you a new OTP. Please verify your email."
                : "Please enter the OTP we sent you to verify your email."
        );

        navigation.navigate("AuthenticationVerifyPage", {
          email: lower,
          from: "signin",
        });
        return;
      }

      // Normal success
      if (data && data.token) {
        setEmail("");
        setPassword("");
        navigation.navigate("Explore");
        return;
      }

      // Fallback
      setSignInError("Failed to sign in.");
    } catch (error) {
      const raw =
          typeof error === "string" ? error : error?.message ? error.message : "";

      const friendly =
          raw === "User not found"
              ? "No account found with that email."
              : raw === "Invalid password"
                  ? "Incorrect password. Try again."
                  : raw || "Failed to sign in.";

      setSignInError(friendly);
    }
  };

  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";

  return (
      <LinearGradient
          colors={switchEnabled ? ["#232526", "#414345"] : ["#064E41", "#3D8C45"]}
          style={tw`flex-1 justify-center items-center`}
      >
        <SafeAreaView style={tw`flex-1 w-full justify-center items-center`}>
          {/* Header */}
          <View
              style={tw`w-full flex flex-row items-center justify-between px-4 mt-4 mb-2`}
          >
            <TouchableOpacity
                style={tw`p-2 rounded-full bg-white/20 backdrop-blur-sm`}
                onPress={() => navigation.navigate("GuestExplorePage")}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <Text style={tw`font-bold text-3xl text-white`}>Tic Tec Toe</Text>

            <TouchableOpacity
                onPress={togglePageTheme}
                style={tw`p-2 rounded-full bg-white/20 backdrop-blur-sm`}
            >
              <MaterialIcons
                  name={switchEnabled ? "wb-sunny" : "nightlight-round"}
                  size={28}
                  color="white"
              />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={tw`flex-1 justify-center w-full`}
          >
            <ScrollView
                contentContainerStyle={tw`flex-grow justify-start items-center`}
                keyboardShouldPersistTaps="handled"
            >
              <View
                  style={tw`w-full max-w-sm flex-1 justify-between items-center h-full`}
              >
                <View style={tw`w-80 pt-12 pb-12`}>
                  <Text style={tw`font-bold text-4xl text-white mb-8 text-center`}>
                    Sign In
                  </Text>

                  {/* Email */}
                  <View style={tw`mb-8 w-80`}>
                    <Text style={tw`text-xl font-bold text-white mb-4 ml-1`}>
                      Email*
                    </Text>
                    <TextInput
                        style={tw.style(
                            "h-16 rounded-xl px-4 shadow-md text-lg",
                            inputBgColor,
                            inputTextColor
                        )}
                        onChangeText={setEmail}
                        value={email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={handleSubmit}
                        placeholder="Enter your email"
                        placeholderTextColor={switchEnabled ? "#999" : "#888"}
                    />
                  </View>

                  {/* Password + inline error like web */}
                  <View style={tw`mb-4 w-80`}>
                    <Text style={tw`text-xl font-bold text-white mb-4 ml-1`}>
                      Password*
                    </Text>
                    <View
                        style={tw.style(
                            "flex-row items-center rounded-xl shadow-md w-80",
                            inputBgColor
                        )}
                    >
                      <TextInput
                          style={tw.style("flex-1 h-16 px-4 text-lg", inputTextColor)}
                          onChangeText={setPassword}
                          value={password}
                          secureTextEntry={!showPassword}
                          autoCorrect={false}
                          onSubmitEditing={handleSubmit}
                          placeholder="Enter your password"
                          placeholderTextColor={switchEnabled ? "#999" : "#888"}
                      />
                      <TouchableOpacity
                          onPress={togglePasswordVisibility}
                          style={tw`pr-4`}
                      >
                        <Ionicons
                            name={showPassword ? "eye" : "eye-off"}
                            size={28}
                            color={switchEnabled ? "#999" : "#888"}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* inline error like web version */}
                    {signInError ? (
                        <Text style={tw`text-red-300 mt-2 ml-1 text-sm`}>
                          {signInError}
                        </Text>
                    ) : null}
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity
                      onPress={() => navigation.navigate("RequestResetPasswordPage")}
                  >
                    <Text style={tw`text-blue-200 text-base text-right w-80 mb-8`}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Buttons */}
                <View style={tw`w-80 mb-2 mt--3`}>
                  <TouchableOpacity
                      style={tw`mt-2 mb-4 w-80 h-16 rounded-full bg-[#57B360] flex items-center justify-center shadow-lg`}
                      onPress={handleSubmit}
                      activeOpacity={0.85}
                  >
                    <Text style={tw`text-white font-bold text-xl`}>Sign In</Text>
                  </TouchableOpacity>

                  <View style={tw`flex-row items-center w-80 my-2`}>
                    <View style={tw`flex-1 h-0.5 bg-gray-300`} />
                    <Text style={tw`mx-2 text-gray-300`}>or</Text>
                    <View style={tw`flex-1 h-0.5 bg-gray-300`} />
                  </View>

                  <TouchableOpacity
                      style={tw`mt-2 mb-2 w-80 h-16 rounded-full bg-white flex items-center justify-center shadow`}
                      onPress={() =>
                          navigation.navigate("AuthenticationSignUpPage")
                      }
                      activeOpacity={0.85}
                  >
                    <Text style={tw`text-[#057B34] font-bold text-xl`}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
  );
};

export default AuthenticationSignInPage;