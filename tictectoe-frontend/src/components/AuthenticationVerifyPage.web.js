
import React, { useState, useRef, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView,
  Image,
  Keyboard,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { verifyOtp } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../../api";

const AuthenticationVerifyPage = () => {
  const [otp, setInputValue] = useState("");
  const [switchEnabled, setSwitchEnable] = useState(false);
  const route = useRoute();
  const { email } = route?.params || "(No email provided)";
  const textColor = switchEnabled ? "text-black" : "text-white";
  const [emailState, setEmailState] = useState("");
  const navigation = useNavigation();
  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };
  useEffect(() => {
    const localStorageEmail = localStorage.getItem("verifyPageEmail");
    if (email) {
      setEmailState(email);
      localStorage.setItem("verifyPageEmail", email);
    } else {
      if (localStorageEmail) {
        setEmailState(localStorageEmail)
      }
    }
  }, [email, route])

  const handleUserInput = (text) => {
    setInputValue(text);
  };

  const handleSubmit = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the one-time password");
      return;
    }


    try {
      const response = await verifyOtp(emailState, otp);

      if (response && response.token) {
        const { token } = response;
        await AsyncStorage.setItem("jwtToken", token);
        localStorage.removeItem("verifyPageEmail");

        // Set the token for future requests
        setAuthToken(token);

        alert("Success Account created successfully");
        navigation.navigate("Explore");
      } else {
        alert("Error Verification failed");
      }
    } catch (error) {
      if (error?.message == "Invalid token") {
        signOut();
      }
      alert("Error", error.toString());
    }
  };

  return (
    <LinearGradient
      colors={["#064E41", "#3D8C45"]}
      style={tw`flex flex-1 flex-col h-full w-full py-14 items-center`}
    >
      <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
        <TouchableWithoutFeedback >

          <View
            style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}
          >
            <View style={tw`flex-row justify-center items-center mb-6 mt--12`}>
              <View style={tw`flex-row items-center`}>
                <Image
                  source={require("../../assets/Logo-Transparent.png")}
                  style={tw`w-20 h-20 mr--5`}
                />
                <Text style={tw`font-bold text-3xl text-white ml-2 mr-12`}
                  onPress={() => navigation.navigate("LandingPage")}
                >
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

            <Text style={tw`font-bold text-3xl mb-5 text-white mt-10`}>
              Enter Verification Code
            </Text>
            <Text style={tw`text-white text-base mt-5 mb-5`}>
              Enter the OTP sent to {emailState}
            </Text>

            <TextInput
              style={tw`w-80 h-15 rounded-md mx-10 p-4 ${switchEnabled ? `bg-black text-white` : "bg-white text-black"
                }`}
              onChangeText={handleUserInput}
              value={otp}
              keyboardType="numeric"
              maxLength={6}
              placeholder="One Time Password*"
              placeholderTextColor={switchEnabled ? "#999" : "#666"}
              onSubmitEditing={handleSubmit}
            ></TextInput>

            <TouchableOpacity
              style={[
                tw` mt-8 mb-1 w-60 h-15 shadow-lg rounded-lg flex items-center justify-center`,
                { backgroundColor: "#57B360" },
              ]}
              onPress={handleSubmit}
            >
              <Text style={tw`text-white font-bold text-lg ${textColor} `}>
                Verify
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AuthenticationVerifyPage;
