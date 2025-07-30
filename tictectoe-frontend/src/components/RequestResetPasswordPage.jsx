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
  Switch
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { requestResetPassword } from "../../api";

const RequestResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const navigation = useNavigation();
  const [switchEnabled, setSwitchEnable] = useState(false);
  const textColor = switchEnabled ? "text-black" : "text-white";
  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      await requestResetPassword(email);
      Alert.alert("Success", "An OTP has been sent to your email");
      navigation.navigate("VerifyResetOtpPage", { email });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    }
  };

  return (
    <LinearGradient
      colors={["#064E41", "#3D8C45"]}
      style={tw`flex flex-1 flex-col h-full w-full py-14 items-center`}
    >
      <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
        <ScrollView contentContainerStyle={tw`flex-grow`}>

          <View
            style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}
          >
            <View style={tw`flex-row justify-center items-center mb-6 mt--12`}>
              <View style={tw`flex-row items-center`}>
                <Image
                  source={require("../../assets/Logo-Transparent.png")}
                  style={tw`w-20 h-20 mr--5`}
                />
                <Text style={tw`font-bold text-3xl text-white ml-2 mr-12`}>
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

            <Text style={tw`font-bold text-3xl text-white mt-10 mb-5`}>
              Reset Password
            </Text>

            <Text style={tw`text-white mb-3 text-base`}>
              Enter the email associated with your account to reset your
              password
            </Text>

            <TextInput
              style={tw`w-80 h-14 bg-white rounded-md mx-10 p-4 text-black ${switchEnabled ? `bg-black text-white` : "bg-white text-black"
                }`}
              placeholder="Enter your email"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              placeholderTextColor={switchEnabled ? "#999" : "#666"}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                tw`mt-8 mb-1 w-60 h-15 shadow-lg rounded-lg flex items-center justify-center`,
                { backgroundColor: "#57B360" },
              ]}
              onPress={handleResetPassword}
            >
              <Text style={tw`text-white font-bold text-lg ${textColor}`}>Send OTP</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default RequestResetPasswordPage;
