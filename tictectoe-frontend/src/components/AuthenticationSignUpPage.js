import React, { useState, useEffect } from "react";
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
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { signUp } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../../api";
import {useRoute, useFocusEffect } from "@react-navigation/native";
import { fetchAvailableInterests } from "../../api"; // if not already imported


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
  const [errorMsg, setErrorMsg] = useState("");
  
  useEffect(() => {
    const getInterests = async () => {
      try {
        const interestArray = await fetchAvailableInterests(); // No need to access `response.data`
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
  

  const route = useRoute();

useFocusEffect(() => {
  if (route.params?.updatedInterests) {
    setSelectedInterests(route.params.updatedInterests);
    navigation.setParams({ updatedInterests: undefined });
  }
});

  

  const updatePasswordRequirements = (password) => {
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      specialChar: /[@#$%&*]/.test(password),
      number: /[0-9]/.test(password),
    });
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
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

  const navigation = useNavigation();

  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex for basic email format validation
    if (!emailPattern.test(email)) {
      return "Invalid email format.";
    }
    return "";
  };

  const handleSubmit = async () => {
    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);
    if (emailValidationError) {
      setErrorMsg(emailValidationError);
      return;
    }
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setErrorMsg(passwordValidationError);
      return;
    }
    if (!fullName) {
      setErrorMsg("Please Enter your Full Name");
      return;
    }
    if (!userName) {
      setErrorMsg("Please enter your username");
      return;
    }
    if (!email) {
      setErrorMsg("Please enter your email address");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password");
      return;
    }
    setErrorMsg("");
    const lowerCaseEmail = email.toLowerCase();

    const response = await signUp({ email: email.toLowerCase(), password, fullName, userName, userInterest: selectedInterests });
    if (response?.status === 200) {
      const { token } = response.data;
      console.log("OTP sent")
      navigation.navigate("AuthenticationVerifyPage", { email: lowerCaseEmail });
      Alert.alert("Success", "Account created, OTP sent to your email!");
    } else {
      console.log("Something went wrong", response);
    }
  };

  const textColor = switchEnabled ? "text-black" : "text-white";
  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";
  const toggleInterest = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(item => item !== interest);
      }
      return [...prev, interest];
    });
  };

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
          <ScrollView contentContainerStyle={tw`flex-grow justify-center items-center`}>
            <View style={tw`w-full max-w-sm items-center`}>
              <Text style={tw`font-bold text-2xl text-white mb-4`}>Create Your Account</Text>
              {errorMsg ? (
                <Text style={tw`text-red-400 mb-2 text-center`}>{errorMsg}</Text>
              ) : null}
              <View style={tw`mb-4 w-80`}> 
              <TextInput
                  style={tw`h-14 rounded-xl px-4 bg-white text-black shadow-md focus:bg-gray-100`}
                onChangeText={setFullName}
                value={fullName}
                placeholder="Enter your full name"
                  placeholderTextColor="#888"
              />
            </View>
              <View style={tw`mb-4 w-80`}> 
              <TextInput
                  style={tw`h-14 rounded-xl px-4 bg-white text-black shadow-md focus:bg-gray-100`}
                onChangeText={setUserName}
                value={userName}
                placeholder="Choose a username*"
                  placeholderTextColor="#888"
                autoCapitalize="none"
              />
            </View>
              <View style={tw`mb-4 w-80`}> 
              <TextInput
                  style={tw`h-14 rounded-xl px-4 bg-white text-black shadow-md focus:bg-gray-100`}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError("");
                }}
                value={email}
                keyboardType="email-address"
                placeholder="Enter your institution email*"
                  placeholderTextColor="#888"
                autoCapitalize="none"
              />
              {emailError ? (
                <Text style={tw`text-red-500 mt-1`}>{emailError}</Text>
              ) : null}
            </View>
              <View style={tw`flex-row items-center w-80 bg-white rounded-xl mb-2 shadow-md`}> 
              <TextInput
                  style={tw`flex-1 h-14 px-4 text-black`}
                onChangeText={handlePasswordChange}
                value={password}
                secureTextEntry={!showPassword}
                placeholder="Create a password*"
                  placeholderTextColor="#888"
                onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={tw`pr-4`}>
                  <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="#888" />
              </TouchableOpacity>
            </View>
            {password && (
                <View style={tw`mb-4 w-80`}> 
                <Text style={tw`font-bold mb-1 text-white`}>Password requirements:</Text>
                  <Text style={tw`${passwordRequirements.length ? "text-teal-300" : "text-amber-200"}`}>{passwordRequirements.length ? "✓" : "×"} At least 8 characters long</Text>
                  <Text style={tw`${passwordRequirements.uppercase ? "text-teal-300" : "text-amber-200"}`}>{passwordRequirements.uppercase ? "✓" : "×"} Contains at least one uppercase letter</Text>
                  <Text style={tw`${passwordRequirements.specialChar ? "text-teal-300" : "text-amber-200"}`}>{passwordRequirements.specialChar ? "✓" : "×"} Contains at least one special character (@, #, $, %, &)</Text>
                  <Text style={tw`${passwordRequirements.number ? "text-teal-300" : "text-amber-200"}`}>{passwordRequirements.number ? "✓" : "×"} Contains at least one number</Text>
              </View>
            )}
              <View style={tw`max-w-sm w-80 mb-4`}> 
                <Text style={tw`font-bold mb-1 text-white`}>Select your interests (minimum 2):</Text>
              <View style={tw`flex-row flex-wrap justify-center mb-4`}>
                {Object.keys(availableInterests).map((mainCategory) => {
                    const isSelected = availableInterests[mainCategory]?.some((sub) => selectedInterests.includes(sub));
                  return (
                    <TouchableOpacity
                      key={mainCategory}
                        onPress={() => navigation.navigate("SubInterestPage", { mainCategory, subInterests: availableInterests[mainCategory], selectedInterests, switchEnabled })}
                        style={[tw`m-1 px-3 py-2 rounded-full shadow`, { backgroundColor: isSelected ? "#57B360" : switchEnabled ? "#2a2a2a" : "#ffffff" }]}
                      >
                        <Text style={[tw`text-sm`, { color: isSelected ? "#ffffff" : switchEnabled ? "#ffffff" : "#000000" }]}>{mainCategory}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={tw`flex-row flex-wrap justify-center`}>
                {selectedInterests.map((interest) => (
                    <View key={interest} style={tw`m-1 px-2 py-1 rounded-full bg-teal-600`}>
                    <Text style={tw`text-white text-xs`}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
              <View style={tw`flex-row items-center mb-4 w-80`}> 
              <Switch
                value={subscribeNewsletter}
                onValueChange={setSubscribeNewsletter}
                trackColor={{ false: "#767577", true: "#84cc16" }}
                thumbColor={subscribeNewsletter ? "#4CAF50" : "#f4f3f4"}
              />
              <Text style={tw`ml-2 text-white`}>Receive weekly newsletters</Text>
            </View>
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
                <Text style={tw`text-[#057B34] font-bold text-lg`}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AuthenticationSignUpPage;

