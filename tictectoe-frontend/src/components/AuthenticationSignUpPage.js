/*
 * @author Muhammad Shafay Zulfiqar
 * @date 20th Nov, 2025
 * Sign in page – user signs in with email + password,
 * can go to sign up, toggle dark mode, or reset password.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import {
  signUp,
  fetchAvailableInterests,
  checkEmailAvailability,
} from "../../api";

const AuthenticationSignUpPage = () => {
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [switchEnabled, setSwitchEnable] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
    number: false,
  });

  const [availableInterests, setAvailableInterests] = useState({});
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestError, setInterestError] = useState("");

  const navigation = useNavigation();
  const route = useRoute();

  // fetch interests like web
  useEffect(() => {
    const getInterests = async () => {
      try {
        const interestArray = await fetchAvailableInterests();
        const formattedData = {};

        interestArray.forEach((item) => {
          const subcategories = JSON.parse(item.SubCategory);
          formattedData[item.PrimaryCategory] = subcategories;
        });

        setAvailableInterests(formattedData);
      } catch (error) {
        console.error("Error fetching interests:", error);
      }
    };

    getInterests();
  }, []);

  // pick up updated interests from SubInterestPage
  useFocusEffect(
      React.useCallback(() => {
        if (route.params?.updatedInterests) {
          setSelectedInterests(route.params.updatedInterests);
          navigation.setParams({ updatedInterests: undefined });
        }
      }, [route.params?.updatedInterests, navigation])
  );

  // clear interest error once user has enough
  useEffect(() => {
    if (selectedInterests.length >= 2 && interestError) {
      setInterestError("");
    }
  }, [selectedInterests, interestError]);

  const updatePasswordRequirements = (pwd) => {
    setPasswordRequirements({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      specialChar: /[@#$%&*]/.test(pwd),
      number: /[0-9]/.test(pwd),
    });
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    updatePasswordRequirements(value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((previous) => !previous);
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[@#$%&*]/.test(pwd)) {
      return "Password must contain at least one special character (@, #, $, %, &, *).";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    return "";
  };

  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const validateEmail = (val) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(val)) {
      return "Invalid email format.";
    }
    return "";
  };

  const validateInstitutionEmail = (val) =>
      /@(?:[a-z0-9.-]+\.)?(dal\.ca|dalhousie\.ca)$/i.test(
          (val || "").trim()
      );

  const handleEmailBlur = async () => {
    const value = (email || "").trim().toLowerCase();
    setEmailError("");

    const fmtErr = validateEmail(value);
    if (fmtErr) {
      setEmailError(fmtErr);
      return false;
    }

    if (!validateInstitutionEmail(value)) {
      setEmailError(
          "Please use your institutional email (dal.ca or dalhousie.ca)."
      );
      return false;
    }

    try {
      const res = await checkEmailAvailability(value);

      if (res.available === true) {
        return true;
      }

      if (res.available === false && res.reason === "unverified") {
        setEmailError(
            "Account pending verification. We’ll resend your OTP on submit."
        );
        // allow submit (signup will resend OTP)
        return true;
      }

      setEmailError("Email already in use");
      return false;
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        setEmailError("Email already in use");
        return false;
      }

      setEmailError("Could not validate email. Try again.");
      return false;
    }
  };

  const handleSubmit = async () => {
    // re-check email before submit like web
    const ok = await handleEmailBlur();
    if (!ok) return;

    const normalizedEmail = (email || "").trim().toLowerCase();
    const emailValidationError = validateEmail(normalizedEmail);

    setEmailError(emailValidationError);
    if (emailValidationError) return;

    if (!validateInstitutionEmail(normalizedEmail)) {
      Alert.alert(
          "Error",
          "Please use your institutional email (dal.ca or dalhousie.ca)."
      );
      return;
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      Alert.alert("Error", passwordValidationError);
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    if (!userName.trim()) {
      Alert.alert("Error", "Please enter your username");
      return;
    }

    if (!normalizedEmail) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    if (!Array.isArray(selectedInterests) || selectedInterests.length < 2) {
      setInterestError("Pick at least 2 interests.");
      return;
    }

    try {
      const response = await signUp({
        email: normalizedEmail,
        password,
        fullName: fullName.trim(),
        userName: userName.trim(),
        userInterest: selectedInterests,
        subscribeNewsletter,
      });

      if (response?.status === 200) {
        navigation.navigate("AuthenticationVerifyPage", {
          email: normalizedEmail,
        });
        Alert.alert("Success", "Account created. OTP sent to your email.");
      } else {
        Alert.alert("Signup failed", "Unexpected response from server.");
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create account.";

      if (status === 409) {
        Alert.alert("Email in use", "That email is already registered.");
      } else if (status === 400) {
        Alert.alert("Invalid input", msg);
      } else {
        Alert.alert("Error", msg);
      }
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
                contentContainerStyle={tw`flex-grow justify-center items-center`}
                keyboardShouldPersistTaps="handled"
            >
              <View style={tw`w-full max-w-sm items-center`}>
                <Text style={tw`font-bold text-2xl text-white mb-4`}>
                  Create Your Account
                </Text>

                {/* Full Name */}
                <View style={tw`mb-4 w-80`}>
                  <Text style={tw`text-white font-semibold mb-1 ml-1`}>
                    Full Name
                  </Text>
                  <TextInput
                      style={tw.style(
                          "h-14 rounded-xl px-4 shadow-md",
                          inputBgColor,
                          inputTextColor
                      )}
                      onChangeText={setFullName}
                      value={fullName}
                      placeholder="Enter your full name"
                      placeholderTextColor={switchEnabled ? "#999" : "#888"}
                  />
                </View>

                {/* Username */}
                <View style={tw`mb-4 w-80`}>
                  <Text style={tw`text-white font-semibold mb-1 ml-1`}>
                    Username
                  </Text>
                  <TextInput
                      style={tw.style(
                          "h-14 rounded-xl px-4 shadow-md",
                          inputBgColor,
                          inputTextColor
                      )}
                      onChangeText={setUserName}
                      value={userName}
                      placeholder="Choose a username*"
                      placeholderTextColor={switchEnabled ? "#999" : "#888"}
                      autoCapitalize="none"
                      autoCorrect={false}
                  />
                </View>

                {/* Email */}
                <View style={tw`mb-4 w-80`}>
                  <Text style={tw`text-white font-semibold mb-1 ml-1`}>
                    Institution Email
                  </Text>
                  <TextInput
                      style={tw.style(
                          "h-14 rounded-xl px-4 shadow-md",
                          inputBgColor,
                          inputTextColor
                      )}
                      onChangeText={(value) => {
                        setEmail(value);
                        setEmailError("");
                      }}
                      onBlur={handleEmailBlur}
                      value={email}
                      keyboardType="email-address"
                      placeholder="Enter your institution email*"
                      placeholderTextColor={switchEnabled ? "#999" : "#888"}
                      autoCapitalize="none"
                      autoCorrect={false}
                  />
                  {emailError ? (
                      <Text style={tw`text-red-300 mt-1 ml-1 text-xs`}>
                        {emailError}
                      </Text>
                  ) : null}
                </View>

                {/* Password + requirements */}
                <View style={tw`mb-2 w-80`}>
                  <Text style={tw`text-white font-semibold mb-1 ml-1`}>
                    Password
                  </Text>
                  <View
                      style={tw.style(
                          "flex-row items-center w-80 rounded-xl shadow-md",
                          inputBgColor
                      )}
                  >
                    <TextInput
                        style={tw.style("flex-1 h-14 px-4", inputTextColor)}
                        onChangeText={handlePasswordChange}
                        value={password}
                        secureTextEntry={!showPassword}
                        placeholder="Create a password*"
                        placeholderTextColor={switchEnabled ? "#999" : "#888"}
                        onSubmitEditing={handleSubmit}
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={tw`pr-4`}
                    >
                      <Ionicons
                          name={showPassword ? "eye" : "eye-off"}
                          size={24}
                          color={switchEnabled ? "#999" : "#888"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {password ? (
                    <View style={tw`mb-4 w-80`}>
                      <Text style={tw`font-bold mb-1 text-white`}>
                        Password requirements:
                      </Text>
                      <Text
                          style={tw`${
                              passwordRequirements.length
                                  ? "text-teal-300"
                                  : "text-amber-200"
                          }`}
                      >
                        {passwordRequirements.length ? "✓" : "×"} At least 8
                        characters long
                      </Text>
                      <Text
                          style={tw`${
                              passwordRequirements.uppercase
                                  ? "text-teal-300"
                                  : "text-amber-200"
                          }`}
                      >
                        {passwordRequirements.uppercase ? "✓" : "×"} At least one
                        uppercase letter
                      </Text>
                      <Text
                          style={tw`${
                              passwordRequirements.specialChar
                                  ? "text-teal-300"
                                  : "text-amber-200"
                          }`}
                      >
                        {passwordRequirements.specialChar ? "✓" : "×"} At least one
                        special character (@, #, $, %, &, *)
                      </Text>
                      <Text
                          style={tw`${
                              passwordRequirements.number
                                  ? "text-teal-300"
                                  : "text-amber-200"
                          }`}
                      >
                        {passwordRequirements.number ? "✓" : "×"} At least one
                        number
                      </Text>
                    </View>
                ) : null}

                {/* Interests */}
                <View style={tw`max-w-sm w-80 mb-4`}>
                  <Text style={tw`font-bold mb-1 text-white`}>
                    Select your interests (minimum 2):
                  </Text>
                  <View style={tw`flex-row flex-wrap justify-center mb-4`}>
                    {Object.keys(availableInterests).map((mainCategory) => {
                      const isSelected = availableInterests[mainCategory]?.some(
                          (sub) => selectedInterests.includes(sub)
                      );

                      return (
                          <TouchableOpacity
                              key={mainCategory}
                              onPress={() =>
                                  navigation.navigate("SubInterestPage", {
                                    mainCategory,
                                    subInterests: availableInterests[mainCategory],
                                    selectedInterests,
                                    switchEnabled,
                                  })
                              }
                              style={tw.style("m-1 px-3 py-2 rounded-full shadow", {
                                backgroundColor: isSelected
                                    ? "#57B360"
                                    : switchEnabled
                                        ? "#2a2a2a"
                                        : "#ffffff",
                              })}
                          >
                            <Text
                                style={tw.style("text-sm", {
                                  color: isSelected
                                      ? "#ffffff"
                                      : switchEnabled
                                          ? "#ffffff"
                                          : "#000000",
                                })}
                            >
                              {mainCategory}
                            </Text>
                          </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={tw`flex-row flex-wrap justify-center`}>
                    {selectedInterests.map((interest) => (
                        <View
                            key={interest}
                            style={tw`m-1 px-2 py-1 rounded-full bg-teal-600`}
                        >
                          <Text style={tw`text-white text-xs`}>{interest}</Text>
                        </View>
                    ))}
                  </View>

                  {interestError ? (
                      <Text style={tw`text-red-300 mt-2 ml-1 text-xs`}>
                        {interestError}
                      </Text>
                  ) : null}
                </View>

                {/* Newsletter */}
                <View style={tw`flex-row items-center mb-4 w-80`}>
                  <Switch
                      value={subscribeNewsletter}
                      onValueChange={setSubscribeNewsletter}
                      trackColor={{ false: "#767577", true: "#84cc16" }}
                      thumbColor={subscribeNewsletter ? "#4CAF50" : "#f4f3f4"}
                  />
                  <Text style={tw`ml-2 text-white`}>
                    Receive weekly newsletters
                  </Text>
                </View>

                {/* CTA buttons */}
                <TouchableOpacity
                    style={tw`mt-2 mb-4 w-80 h-14 rounded-full bg-[#57B360] flex items-center justify-center shadow-lg`}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                >
                  <Text style={tw`text-white font-bold text-lg`}>Sign Up</Text>
                </TouchableOpacity>

                <View style={tw`flex-row items-center w-80 my-2`}>
                  <View style={tw`flex-1 h-0.5 bg-gray-300`} />
                  <Text style={tw`mx-2 text-gray-400`}>or</Text>
                  <View style={tw`flex-1 h-0.5 bg-gray-300`} />
                </View>

                <TouchableOpacity
                    style={tw`mt-2 mb-2 w-80 h-14 rounded-full bg-white flex items-center justify-center shadow`}
                    onPress={() => navigation.navigate("AuthenticationSignInPage")}
                    activeOpacity={0.85}
                >
                  <Text style={tw`text-[#057B34] font-bold text-lg`}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
  );
};

export default AuthenticationSignUpPage;