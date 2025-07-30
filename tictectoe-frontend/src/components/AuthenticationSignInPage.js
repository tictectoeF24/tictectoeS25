/*
 * @author Sahil Tanna
 * @date 3rd Oct, 2024
 * This is the sign in page where the user can sign into the app by providing their
 * email and password.
 * There is an additional button to go to the sign up page alongwith a toggle button for dark mode
 */



import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { signIn, signOut } from "../../api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from "../../api";

const AuthenticationSignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [switchEnabled, setSwitchEnable] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigation = useNavigation();

  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMsg("All fields are mandatory");
      return;
    }
    setErrorMsg("");
    try {
      const data = await signIn(email, password);
      if (data && data.token) {
        await AsyncStorage.setItem("jwtToken", data.token);
        setEmail("");
        setPassword("");
        Alert.alert("Success", "Signed in successfully");
        navigation.navigate("Explore");
      } else {
        setErrorMsg("Failed to sign in");
      }
    } catch (error) {
      if (error?.message == "Invalid token") {
        signOut();
      }
      setErrorMsg(error.message || "Invalid email or password");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const textColor = switchEnabled ? "text-black" : "text-white";
  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";

  return (
    <LinearGradient
      colors={switchEnabled ? ["#232526", "#414345"] : ["#064E41", "#3D8C45"]}
      style={tw`flex-1 justify-center items-center`}
    >
      <SafeAreaView style={tw`flex-1 w-full justify-center items-center`}>
        <View style={tw`w-full flex flex-row items-center justify-between px-4 mt-4 mb-2`}>
          <TouchableOpacity
            style={tw`p-2 rounded-full bg-white/20 backdrop-blur-sm`}
            onPress={() => navigation.navigate('GuestExplorePage')}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={tw`font-bold text-3xl text-white`}>Tic Tec Toe</Text>
          <TouchableOpacity onPress={togglePageTheme} style={tw`p-2 rounded-full bg-white/20 backdrop-blur-sm`}>
            <MaterialIcons name={switchEnabled ? "wb-sunny" : "nightlight-round"} size={28} color="white" />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1 justify-center w-full`}
        >
          <ScrollView contentContainerStyle={tw`flex-grow justify-start items-center`}>
            <View style={tw`w-full max-w-sm flex-1 justify-between items-center h-full`}>
              <View style={tw`w-80 pt-12 pb-12`}> 
                <Text style={tw`font-bold text-4xl text-white mb-8 text-center`}>Sign In</Text>
                {errorMsg ? (
                  <Text style={tw`text-red-400 mb-6 text-center`}>{errorMsg}</Text>
                ) : null}
                <View style={tw`mb-8 w-80`}>
                  <Text style={tw`text-xl font-bold text-white mb-4 ml-1`}>Email*</Text>
                  <TextInput
                    style={tw`h-16 rounded-xl px-4 bg-white text-black shadow-md focus:bg-gray-100 text-lg`}
                    onChangeText={setEmail}
                    value={email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Enter your email"
                    placeholderTextColor="#888"
                  />
                </View>
                <View style={tw`mb-8 w-80`}>
                  <Text style={tw`text-xl font-bold text-white mb-4 ml-1`}>Password*</Text>
                  <View style={tw`flex-row items-center rounded-xl bg-white shadow-md w-80`}>
                    <TextInput
                      style={tw`flex-1 h-16 px-4 text-black text-lg`}
                      onChangeText={setPassword}
                      value={password}
                      secureTextEntry={!showPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#888"
                    />
                    <TouchableOpacity onPress={togglePasswordVisibility} style={tw`pr-4`}>
                      <Ionicons name={showPassword ? "eye" : "eye-off"} size={28} color="#888" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("RequestResetPasswordPage")}> 
                  <Text style={tw`text-blue-200 text-base text-right w-80 mb-8`}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
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
                  <Text style={tw`mx-2 text-gray-400`}>or</Text>
                  <View style={tw`flex-1 h-0.5 bg-gray-300`} />
                </View>
                <TouchableOpacity
                  style={tw`mt-2 mb-2 w-80 h-16 rounded-full bg-white flex items-center justify-center shadow`}
                  onPress={() => navigation.navigate("AuthenticationSignUpPage")}
                  activeOpacity={0.85}
                >
                  <Text style={tw`text-[#057B34] font-bold text-xl`}>Sign Up</Text>
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
