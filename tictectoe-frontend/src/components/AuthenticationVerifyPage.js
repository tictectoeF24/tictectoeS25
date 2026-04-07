import React, { useState, useRef, useEffect } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
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
import { verifyOtp, setAuthToken } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OTP_LENGTH = 6;

const AuthenticationVerifyPage = () => {
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [switchEnabled, setSwitchEnable] = useState(false);
  const [emailState, setEmailState] = useState("");

  const route = useRoute();
  const navigation = useNavigation();
  const inputsRef = useRef([]);

  const { email } = route?.params || {};
  const textColor = switchEnabled ? "text-black" : "text-white";

  const backgroundColors = switchEnabled
      ? ["#0C1C1A", "#2B5A3E"]
      : ["#064E41", "#3D8C45"];

  const togglePageTheme = () => setSwitchEnable((prev) => !prev);

  useEffect(() => {
    const init = async () => {
      const local = await AsyncStorage.getItem("verifyPageEmail");

      if (email) {
        setEmailState(email);
        await AsyncStorage.setItem("verifyPageEmail", email);
        return;
      }

      if (local) {
        setEmailState(local);
      }
    };

    init();
  }, [email]);

  // same behaviour as web
  const handleChangeDigit = (val, index) => {
    const digit = val.replace(/[^0-9]/g, "");
    const updated = [...otpDigits];

    if (digit.length === 0) {
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    updated[index] = digit[digit.length - 1];
    setOtpDigits(updated);

    if (index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otp = otpDigits.join("");

    if (otp.length !== OTP_LENGTH) {
      Alert.alert("Error", `Please enter the ${OTP_LENGTH}-digit code`);
      return;
    }

    try {
      const response = await verifyOtp(emailState, otp);

      if (response?.token) {
        await AsyncStorage.setItem("jwtToken", response.token);
        await AsyncStorage.removeItem("verifyPageEmail");

        setAuthToken(response.token);
        Alert.alert("Success", "Account created successfully");
        navigation.navigate("Explore");
      } else {
        Alert.alert("Error", "Verification failed");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Verification failed");
    }
  };

  const boxBase =
      "w-12 h-14 mx-1 rounded-md text-center text-lg font-semibold";

  return (
      <LinearGradient
          colors={backgroundColors}
          style={tw`flex flex-1 flex-col h-full w-full py-14 items-center`}
      >
        <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
                style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}
            >
              <View style={tw`flex-row justify-center items-center mb-6 mt--12`}>
                <View style={tw`flex-row items-center`}>
                  <Image
                      source={require("../../assets/Logo-Transparent.png")}
                      style={tw`w-20 h-20 mr--5`}
                  />
                  <Text
                      style={tw`font-bold text-3xl text-white ml-2 mr-12`}
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

              {/* OTP BOXES */}
              <View style={tw`flex-row mt-2 mb-4`}>
                {otpDigits.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => (inputsRef.current[index] = ref)}
                        style={tw`${boxBase} ${
                            switchEnabled
                                ? "bg-black text-white border border-white/30"
                                : "bg-white text-black"
                        }`}
                        value={digit}
                        onChangeText={(val) => handleChangeDigit(val, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textContentType="oneTimeCode"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                ))}
              </View>

              <TouchableOpacity
                  style={[
                    tw`mt-8 mb-1 w-60 h-15 shadow-lg rounded-lg flex items-center justify-center`,
                    { backgroundColor: "#57B360" },
                  ]}
                  onPress={handleSubmit}
              >
                <Text style={tw`font-bold text-lg ${textColor}`}>Verify</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </LinearGradient>
  );
};

export default AuthenticationVerifyPage;