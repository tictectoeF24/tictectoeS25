import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Switch
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { verifyResetOtp } from "../../api";

const VerifyResetOtpPage = () => {
  const [otp, setOtp] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;
  const [switchEnabled, setSwitchEnable] = useState(false);
  const textColor = switchEnabled ? "text-black" : "text-white";
  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";


  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    try {
      const response = await verifyResetOtp(email, otp);

      if (response) {
        Alert.alert("Success", "OTP verified. Please set your new password.");
        navigation.navigate("SetNewPasswordPage", { email });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Invalid OTP");
    }
  };

  return (
    <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
      <LinearGradient
        colors={["#064E41", "#3D8C45"]}
        style={tw`flex flex-1 flex-col h-full w-full py-14 items-center`}
      >
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
          <Text style={tw`font-bold text-3xl text-white mb-5`}>Verify OTP</Text>

          <Text style={tw`text-white mb-3 text-base`}>Enter the OTP sent to {email}</Text>

          <TextInput
            style={tw`w-80 h-14 bg-white rounded-md mx-10 p-4 text-black ${switchEnabled ? `bg-black text-white` : "bg-white text-black"
              }`}
            onChangeText={setOtp}
            value={otp}
            keyboardType="numeric"
            maxLength={6}
            placeholder="One Time Password*"
            placeholderTextColor={switchEnabled ? "#999" : "#666"}
          />

          <TouchableOpacity
            style={[
              tw`mt-8 mb-1 w-60 h-15 shadow-lg rounded-lg flex items-center justify-center`,
              { backgroundColor: "#57B360" },
            ]}
            onPress={handleVerifyOtp}
          >
            <Text style={tw`text-white font-bold text-lg ${textColor}`}>Verify OTP</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default VerifyResetOtpPage;
