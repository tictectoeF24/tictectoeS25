import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { signUp, fetchAvailableInterests } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../../api";

const AuthenticationSignUpPage = () => {
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [switchEnabled, setSwitchEnable] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get("window"));
  const [scrollPosition, setScrollPosition] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
    number: false,
  });

  const [availableInterests, setAvailableInterests] = useState({});
  const [selectedInterests, setSelectedInterests] = useState([]);

  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);

  // Dynamic screen size tracking
  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription?.remove();
  }, []);

  // Dynamic size calculations
  const getResponsiveSize = (baseSize) => {
    const baseWidth = 1920;
    const scaleFactor = screenData.width / baseWidth;
    return Math.max(baseSize * scaleFactor, baseSize * 0.8);
  };

  const getResponsivePadding = (basePadding) => {
    return Math.max(basePadding * (screenData.width / 1920), basePadding * 0.6);
  };

  // Dynamic styles
  const dynamicStyles = {
    container: {
      paddingHorizontal: getResponsivePadding(20),
      paddingVertical: getResponsivePadding(16),
    },
    header: {
      marginTop: getResponsiveSize(20),
      marginBottom: getResponsiveSize(20),
      paddingHorizontal: getResponsivePadding(20),
    },
    logo: {
      width: getResponsiveSize(80),
      height: getResponsiveSize(80),
      marginRight: getResponsiveSize(16),
    },
    title: {
      fontSize: getResponsiveSize(48),
    },
    iconButton: {
      padding: getResponsivePadding(16),
    },
    iconSize: getResponsiveSize(28),
    subtitle: {
      fontSize: getResponsiveSize(22),
      marginBottom: getResponsiveSize(24),
    },
    mainCard: {
      width: Math.min(screenData.width * 0.9, 1200),
      padding: getResponsivePadding(40),
      marginBottom: getResponsiveSize(30),
      borderRadius: getResponsiveSize(20),
    },
    cardTitle: {
      fontSize: getResponsiveSize(36),
      marginBottom: getResponsiveSize(32),
    },
    inputContainer: {
      marginBottom: getResponsiveSize(28),
    },
    inputLabel: {
      fontSize: getResponsiveSize(18),
      marginBottom: getResponsiveSize(10),
    },
    input: {
      height: getResponsiveSize(64),
      paddingHorizontal: getResponsivePadding(24),
      paddingRight: getResponsivePadding(64),
      fontSize: getResponsiveSize(18),
      borderRadius: getResponsiveSize(16),
    },
    inputIcon: {
      right: getResponsivePadding(24),
      top: getResponsiveSize(18),
    },
    submitButton: {
      height: getResponsiveSize(64),
      borderRadius: getResponsiveSize(16),
      marginBottom: getResponsiveSize(28),
    },
    submitButtonText: {
      fontSize: getResponsiveSize(22),
    },
    linkText: {
      fontSize: getResponsiveSize(18),
    },
    categoryButton: {
      paddingHorizontal: getResponsivePadding(16),
      paddingVertical: getResponsivePadding(10),
      borderRadius: getResponsiveSize(25),
      marginRight: getResponsiveSize(8),
      marginBottom: getResponsiveSize(8),
    },
    categoryText: {
      fontSize: getResponsiveSize(16),
    },
    interestTag: {
      paddingHorizontal: getResponsivePadding(12),
      paddingVertical: getResponsivePadding(4),
      borderRadius: getResponsiveSize(20),
      marginRight: getResponsiveSize(8),
      marginBottom: getResponsiveSize(8),
    },
    interestTagText: {
      fontSize: getResponsiveSize(14),
    },
    requirementItem: {
      marginBottom: getResponsiveSize(8),
    },
    requirementText: {
      fontSize: getResponsiveSize(16),
    },
    switchContainer: {
      padding: getResponsivePadding(20),
      borderRadius: getResponsiveSize(16),
      marginBottom: getResponsiveSize(28),
    },
    switchText: {
      fontSize: getResponsiveSize(18),
    },
  };

  // Store scroll position before navigation
  const handleScroll = (event) => {
    setScrollPosition(event.nativeEvent.contentOffset.y);
  };

  // Restore scroll position when returning
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.updatedInterests) {
        setSelectedInterests(route.params.updatedInterests);
        navigation.setParams({ updatedInterests: undefined });
        
        // Restore scroll position after a short delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
          }
        }, 100);
      }
    }, [route.params?.updatedInterests, scrollPosition])
  );

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

  useEffect(() => {
    getInterests();
  }, []);

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

  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return "Invalid email format.";
    }
    return "";
  };

  const handleSubmit = async () => {
    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      Alert.alert("Error", passwordValidationError);
      return;
    }

    if (!fullName) {
      Alert.alert("Error", "Please Enter your Full Name");
      return;
    }
    if (!userName) {
      Alert.alert("Error", "Please enter your username");
      return;
    }
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    const lowerCaseEmail = email.toLowerCase();

    const response = await signUp({
      email: lowerCaseEmail,
      password,
      fullName,
      userName,
      userInterest: selectedInterests,
    });

    if (response?.status === 200) {
      const { token } = response.data;
      console.log("OTP sent");
      navigation.navigate("AuthenticationVerifyPage", { email: lowerCaseEmail });
      Alert.alert("Success", "Account created, OTP sent to your email!");
    } else {
      console.log("Signup failed", response);
    }
  };

  const textColor = switchEnabled ? "text-black" : "text-white";
  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";

  return (
    <LinearGradient
      colors={switchEnabled ? ["#232526", "#414345"] : ["#064E41", "#3D8C45"]}
      style={tw`flex-1`}
    >
      <SafeAreaView style={tw`flex-1`}>
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[tw`flex-grow items-center`, dynamicStyles.container]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[tw`w-full flex flex-row items-center justify-between`, dynamicStyles.header]}>
            <TouchableOpacity
              style={[tw`rounded-full bg-white/20 backdrop-blur-sm`, dynamicStyles.iconButton]}
              onPress={() => navigation.navigate('GuestExplorePage')}
            >
              <Ionicons name="arrow-back" size={dynamicStyles.iconSize} color="white" />
            </TouchableOpacity>

            <View style={tw`flex flex-row items-center justify-center`}> 
              <Image
                source={require("../../assets/Logo-Transparent.png")}
                style={[tw`mr-3`, dynamicStyles.logo]}
                resizeMode="contain"
              />
              <Text 
                style={[tw`font-bold text-white`, { fontSize: dynamicStyles.title.fontSize }]}
                onPress={() => navigation.navigate("LandingPage")}
              >
                Tic Tec Toe
              </Text>
            </View>

            <TouchableOpacity
              onPress={togglePageTheme}
              style={[tw`rounded-full bg-white/20 backdrop-blur-sm`, dynamicStyles.iconButton]}
            >
              <MaterialIcons 
                name={switchEnabled ? "wb-sunny" : "nightlight-round"} 
                size={dynamicStyles.iconSize} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <View style={tw`w-full flex items-center`}>
            <Text style={[
              tw`text-white/80 text-center`,
              { 
                fontSize: dynamicStyles.subtitle.fontSize,
                marginBottom: dynamicStyles.subtitle.marginBottom,
                maxWidth: screenData.width * 0.8
              }
            ]}>
              Join our research community and start your academic journey
            </Text>
          </View>

          {/* Main Content Card */}
          <View style={[
            tw`bg-white/10 backdrop-blur-sm shadow-2xl flex flex-col items-center`,
            {
              width: dynamicStyles.mainCard.width,
              padding: dynamicStyles.mainCard.padding,
              marginBottom: dynamicStyles.mainCard.marginBottom,
              borderRadius: dynamicStyles.mainCard.borderRadius,
            }
          ]}>
            <Text style={[
              tw`font-bold text-white text-center`,
              { 
                fontSize: dynamicStyles.cardTitle.fontSize,
                marginBottom: dynamicStyles.cardTitle.marginBottom
              }
            ]}>
              Create Your Account
            </Text>

            {/* Form Fields - Two Column Layout */}
            <View style={[tw`flex-row flex-wrap gap-6 w-full`, { marginBottom: dynamicStyles.inputContainer.marginBottom }]}>
              <View style={[tw`flex-1`, { minWidth: screenData.width * 0.35 }]}>
                <Text style={[
                  tw`text-white font-semibold ml-1`,
                  { 
                    fontSize: dynamicStyles.inputLabel.fontSize,
                    marginBottom: dynamicStyles.inputLabel.marginBottom
                  }
                ]}>
                  Full Name
                </Text>
                <View style={tw`relative`}>
                  <TextInput
                    style={[
                      tw.style(`w-full shadow-lg`, inputBgColor, inputTextColor),
                      {
                        height: dynamicStyles.input.height,
                        paddingHorizontal: dynamicStyles.input.paddingHorizontal,
                        paddingRight: dynamicStyles.input.paddingRight,
                        fontSize: dynamicStyles.input.fontSize,
                        borderRadius: dynamicStyles.input.borderRadius,
                      }
                    ]}
                    onChangeText={setFullName}
                    value={fullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={switchEnabled ? "#999" : "#666"}
                  />
                  <View style={[
                    tw`absolute`,
                    {
                      right: dynamicStyles.inputIcon.right,
                      top: dynamicStyles.inputIcon.top,
                    }
                  ]}>
                    <Ionicons name="person-outline" size={dynamicStyles.iconSize * 0.8} color={switchEnabled ? "#999" : "#666"} />
                  </View>
                </View>
              </View>

              <View style={[tw`flex-1`, { minWidth: screenData.width * 0.35 }]}>
                <Text style={[
                  tw`text-white font-semibold ml-1`,
                  { 
                    fontSize: dynamicStyles.inputLabel.fontSize,
                    marginBottom: dynamicStyles.inputLabel.marginBottom
                  }
                ]}>
                  Username
                </Text>
                <View style={tw`relative`}>
                  <TextInput
                    style={[
                      tw.style(`w-full shadow-lg`, inputBgColor, inputTextColor),
                      {
                        height: dynamicStyles.input.height,
                        paddingHorizontal: dynamicStyles.input.paddingHorizontal,
                        paddingRight: dynamicStyles.input.paddingRight,
                        fontSize: dynamicStyles.input.fontSize,
                        borderRadius: dynamicStyles.input.borderRadius,
                      }
                    ]}
                    onChangeText={setUserName}
                    value={userName}
                    placeholder="Choose a username"
                    placeholderTextColor={switchEnabled ? "#999" : "#666"}
                    autoCapitalize="none"
                  />
                  <View style={[
                    tw`absolute`,
                    {
                      right: dynamicStyles.inputIcon.right,
                      top: dynamicStyles.inputIcon.top,
                    }
                  ]}>
                    <Ionicons name="at-outline" size={dynamicStyles.iconSize * 0.8} color={switchEnabled ? "#999" : "#666"} />
                  </View>
                </View>
              </View>
            </View>

            {/* Email Field */}
            <View style={[tw`w-full`, { marginBottom: dynamicStyles.inputContainer.marginBottom }]}>
              <Text style={[
                tw`text-white font-semibold ml-1`,
                { 
                  fontSize: dynamicStyles.inputLabel.fontSize,
                  marginBottom: dynamicStyles.inputLabel.marginBottom
                }
              ]}>
                Email Address
              </Text>
              <View style={tw`relative`}>
                <TextInput
                  style={[
                    tw.style(`w-full shadow-lg`, inputBgColor, inputTextColor),
                    {
                      height: dynamicStyles.input.height,
                      paddingHorizontal: dynamicStyles.input.paddingHorizontal,
                      paddingRight: dynamicStyles.input.paddingRight,
                      fontSize: dynamicStyles.input.fontSize,
                      borderRadius: dynamicStyles.input.borderRadius,
                    }
                  ]}
                  onChangeText={(value) => {
                    setEmail(value);
                    setEmailError("");
                  }}
                  value={email}
                  keyboardType="email-address"
                  placeholder="Enter your institution email"
                  placeholderTextColor={switchEnabled ? "#999" : "#666"}
                  autoCapitalize="none"
                />
                <View style={[
                  tw`absolute`,
                  {
                    right: dynamicStyles.inputIcon.right,
                    top: dynamicStyles.inputIcon.top,
                  }
                ]}>
                  <Ionicons name="mail-outline" size={dynamicStyles.iconSize * 0.8} color={switchEnabled ? "#999" : "#666"} />
                </View>
              </View>
              {emailError ? (
                <Text style={[tw`text-red-300 mt-2 ml-1`, { fontSize: dynamicStyles.linkText.fontSize * 0.8 }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={[tw`w-full`, { marginBottom: dynamicStyles.inputContainer.marginBottom }]}>
              <Text style={[
                tw`text-white font-semibold ml-1`,
                { 
                  fontSize: dynamicStyles.inputLabel.fontSize,
                  marginBottom: dynamicStyles.inputLabel.marginBottom
                }
              ]}>
                Password
              </Text>
              <View style={tw`relative`}>
                <TextInput
                  style={[
                    tw.style(`w-full shadow-lg`, inputBgColor, inputTextColor),
                    {
                      height: dynamicStyles.input.height,
                      paddingHorizontal: dynamicStyles.input.paddingHorizontal,
                      paddingRight: dynamicStyles.input.paddingRight,
                      fontSize: dynamicStyles.input.fontSize,
                      borderRadius: dynamicStyles.input.borderRadius,
                    }
                  ]}
                  onChangeText={handlePasswordChange}
                  value={password}
                  secureTextEntry={!showPassword}
                  placeholder="Create a strong password"
                  placeholderTextColor={switchEnabled ? "#999" : "#666"}
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={[
                    tw`absolute p-1`,
                    {
                      right: dynamicStyles.inputIcon.right,
                      top: dynamicStyles.inputIcon.top,
                    }
                  ]}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={dynamicStyles.iconSize * 0.8}
                    color={switchEnabled ? "#999" : "#666"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            {password && (
              <View style={[
                tw`w-full bg-white/5 rounded-xl`,
                { 
                  padding: dynamicStyles.switchContainer.padding,
                  borderRadius: dynamicStyles.switchContainer.borderRadius,
                  marginBottom: dynamicStyles.inputContainer.marginBottom
                }
              ]}>
                <Text style={[
                  tw`text-white font-semibold ml-1`,
                  { 
                    fontSize: dynamicStyles.inputLabel.fontSize,
                    marginBottom: dynamicStyles.inputLabel.marginBottom
                  }
                ]}>
                  Password Requirements:
                </Text>
                <View style={tw`flex-row flex-wrap gap-4`}>
                  <View style={[tw`flex-row items-center flex-1`, { minWidth: screenData.width * 0.25 }]}>
                    <Ionicons 
                      name={passwordRequirements.length ? "checkmark-circle" : "close-circle"} 
                      size={dynamicStyles.iconSize * 0.7} 
                      color={passwordRequirements.length ? "#4ade80" : "#f87171"} 
                    />
                    <Text style={[tw`text-white/80 ml-2`, { fontSize: dynamicStyles.requirementText.fontSize }]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={[tw`flex-row items-center flex-1`, { minWidth: screenData.width * 0.25 }]}>
                    <Ionicons 
                      name={passwordRequirements.uppercase ? "checkmark-circle" : "close-circle"} 
                      size={dynamicStyles.iconSize * 0.7} 
                      color={passwordRequirements.uppercase ? "#4ade80" : "#f87171"} 
                    />
                    <Text style={[tw`text-white/80 ml-2`, { fontSize: dynamicStyles.requirementText.fontSize }]}>
                      One uppercase letter
                    </Text>
                  </View>
                  <View style={[tw`flex-row items-center flex-1`, { minWidth: screenData.width * 0.25 }]}>
                    <Ionicons 
                      name={passwordRequirements.specialChar ? "checkmark-circle" : "close-circle"} 
                      size={dynamicStyles.iconSize * 0.7} 
                      color={passwordRequirements.specialChar ? "#4ade80" : "#f87171"} 
                    />
                    <Text style={[tw`text-white/80 ml-2`, { fontSize: dynamicStyles.requirementText.fontSize }]}>
                      One special character
                    </Text>
                  </View>
                  <View style={[tw`flex-row items-center flex-1`, { minWidth: screenData.width * 0.25 }]}>
                    <Ionicons 
                      name={passwordRequirements.number ? "checkmark-circle" : "close-circle"} 
                      size={dynamicStyles.iconSize * 0.7} 
                      color={passwordRequirements.number ? "#4ade80" : "#f87171"} 
                    />
                    <Text style={[tw`text-white/80 ml-2`, { fontSize: dynamicStyles.requirementText.fontSize }]}>
                      One number
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Interests Selection */}
            <View style={[tw`w-full`, { marginBottom: dynamicStyles.inputContainer.marginBottom }]}>
              <Text style={[
                tw`text-white font-semibold ml-1`,
                { 
                  fontSize: dynamicStyles.inputLabel.fontSize,
                  marginBottom: dynamicStyles.inputLabel.marginBottom
                }
              ]}>
                Select your interests (minimum 2):
              </Text>
              <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
                {Object.keys(availableInterests).map((mainCategory) => {
                  const isSelected = availableInterests[mainCategory]?.some((sub) =>
                    selectedInterests.includes(sub)
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
                      style={[
                        tw`border-2`,
                        {
                          backgroundColor: isSelected ? "#57B360" : "transparent",
                          borderColor: isSelected ? "#57B360" : "rgba(255,255,255,0.3)",
                          paddingHorizontal: dynamicStyles.categoryButton.paddingHorizontal,
                          paddingVertical: dynamicStyles.categoryButton.paddingVertical,
                          borderRadius: dynamicStyles.categoryButton.borderRadius,
                          marginRight: dynamicStyles.categoryButton.marginRight,
                          marginBottom: dynamicStyles.categoryButton.marginBottom,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          tw`font-medium`,
                          {
                            color: isSelected ? "#ffffff" : "#ffffff",
                            fontSize: dynamicStyles.categoryText.fontSize,
                          },
                        ]}
                      >
                        {mainCategory}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Display selected interests as tags */}
              {selectedInterests.length > 0 && (
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {selectedInterests.map((interest) => (
                    <View
                      key={interest}
                      style={[
                        tw`bg-[#57B360]/20 border border-[#57B360]/30`,
                        {
                          paddingHorizontal: dynamicStyles.interestTag.paddingHorizontal,
                          paddingVertical: dynamicStyles.interestTag.paddingVertical,
                          borderRadius: dynamicStyles.interestTag.borderRadius,
                          marginRight: dynamicStyles.interestTag.marginRight,
                          marginBottom: dynamicStyles.interestTag.marginBottom,
                        }
                      ]}
                    >
                      <Text style={[tw`text-white font-medium`, { fontSize: dynamicStyles.interestTagText.fontSize }]}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Newsletter Subscription */}
            <View style={[
              tw`flex-row items-center bg-white/5 rounded-xl`,
              {
                padding: dynamicStyles.switchContainer.padding,
                borderRadius: dynamicStyles.switchContainer.borderRadius,
                marginBottom: dynamicStyles.inputContainer.marginBottom,
              }
            ]}>
              <Switch
                value={subscribeNewsletter}
                onValueChange={setSubscribeNewsletter}
                trackColor={{ false: "rgba(255,255,255,0.3)", true: "#57B360" }}
                thumbColor={subscribeNewsletter ? "#ffffff" : "#ffffff"}
                style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
              />
              <Text style={[tw`ml-3 text-white/90`, { fontSize: dynamicStyles.switchText.fontSize }]}>
                Receive weekly newsletters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                tw`w-full bg-[#57B360] items-center justify-center shadow-lg active:bg-[#4CAF50]`,
                {
                  height: dynamicStyles.submitButton.height,
                  borderRadius: dynamicStyles.submitButton.borderRadius,
                  marginBottom: dynamicStyles.submitButton.marginBottom,
                }
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={[
                tw`text-white font-bold`,
                { fontSize: dynamicStyles.submitButtonText.fontSize }
              ]}>
                Create Account
              </Text>
            </TouchableOpacity>

            {/* Sign-In Link */}
            <View style={tw`flex-row justify-center items-center w-full`}>
              <Text style={[
                tw`text-white/80`,
                { fontSize: dynamicStyles.linkText.fontSize }
              ]}>
                Already Registered?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("AuthenticationSignInPage")}>
                <Text style={[
                  tw`text-blue-200 font-semibold underline hover:text-blue-100`,
                  { fontSize: dynamicStyles.linkText.fontSize }
                ]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AuthenticationSignUpPage;

