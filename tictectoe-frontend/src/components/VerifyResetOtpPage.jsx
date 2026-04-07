import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Switch,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { verifyResetOtp } from "../../api";

const OTP_LENGTH = 6;

const VerifyResetOtpPage = () => {
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [emailToUse, setEmailToUse] = useState("");
  const [switchEnabled, setSwitchEnable] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const inputsRef = useRef([]);

  const textColor = switchEnabled ? "text-black" : "text-white";
  const backgroundColors = switchEnabled
      ? ["#0C1C1A", "#2B5A3E"]
      : ["#064E41", "#3D8C45"];

  useEffect(() => {
    const init = async () => {
      const fromParam = (route?.params?.email || "").trim().toLowerCase();

      if (fromParam) {
        setEmailToUse(fromParam);
        await AsyncStorage.setItem("resetEmail", fromParam);
        return;
      }

      const fromStorage = (await AsyncStorage.getItem("resetEmail")) || "";
      setEmailToUse(fromStorage.trim().toLowerCase());
    };

    init();
  }, [route?.params?.email]);

  const togglePageTheme = () => setSwitchEnable((v) => !v);

  const handleChangeDigit = (val, index) => {
    const digit = val.replace(/[^0-9]/g, ""); // numeric only
    const updated = [...otpDigits];

    if (digit.length === 0) {
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    // only keep last typed digit if user pasted
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

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");

    if (!emailToUse) {
      Alert.alert("Error", "Missing email. Please request a new code.");
      navigation.replace("RequestResetPasswordPage");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      Alert.alert("Error", `Please enter the ${OTP_LENGTH}-digit OTP`);
      return;
    }

    try {
      await verifyResetOtp(emailToUse, otp);
      Alert.alert("Success", "OTP verified. Please set your new password.");
      navigation.navigate("SetNewPasswordPage", { email: emailToUse });
    } catch (error) {
      Alert.alert("Error", error.message || "Invalid or expired OTP");
    }
  };

  const boxBase =
      "w-10 h-12 mx-1 rounded-md text-center text-lg font-semibold";

  return (
      <SafeAreaView style={tw`flex flex-col flex-1 h-full w-full`}>
        <LinearGradient
            colors={backgroundColors}
            style={tw`flex flex-1 py-14 items-center`}
        >
          <View
              style={tw`absolute top-14 left-0 right-0 items-center mx-10 my-10`}
          >
            {/* Logo + theme toggle (same pattern as other pages) */}
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

            <Text style={tw`font-bold text-3xl text-white mb-5`}>
              Verify OTP
            </Text>
            <Text style={tw`text-white mb-3 text-base text-center`}>
              Enter the OTP sent to {emailToUse || "(unknown email)"}
            </Text>

            {/* OTP boxes */}
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
                      autoCapitalize="none"
                      autoCorrect={false}
                  />
              ))}
            </View>

            <TouchableOpacity
                style={[
                  tw`mt-4 mb-1 w-60 h-12 shadow-lg rounded-lg items-center justify-center`,
                  { backgroundColor: "#57B360" },
                ]}
                onPress={handleVerifyOtp}
            >
              <Text style={tw`font-bold text-lg ${textColor}`}>
                Verify OTP
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
  );
};

export default VerifyResetOtpPage;