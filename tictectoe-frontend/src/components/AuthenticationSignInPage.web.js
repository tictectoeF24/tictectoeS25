import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { signIn } from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthenticationSignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [switchEnabled, setSwitchEnable] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get("window"));

  const navigation = useNavigation();

  // Dynamic screen size tracking
  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription?.remove();
  }, []);

  // Dynamic size calculations - increased base sizes
  const getResponsiveSize = (baseSize) => {
    const baseWidth = 1920;
    const scaleFactor = screenData.width / baseWidth;
    return Math.max(baseSize * scaleFactor, baseSize * 0.8); // Increased minimum from 0.7 to 0.8
  };

  const getResponsivePadding = (basePadding) => {
    return Math.max(basePadding * (screenData.width / 1920), basePadding * 0.6); // Increased minimum
  };

  const togglePageTheme = () => {
    setSwitchEnable((previousState) => !previousState);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      alert("Error, All fields are mandatory");
      return;
    }

    try {
      const data = await signIn(email, password);

      if (data && data.token) {
        await AsyncStorage.setItem("jwtToken", data.token);
        setEmail("");
        setPassword("");
        Alert.alert("Success", "Signed in successfully");
        navigation.navigate("Explore");
      } else {
        Alert.alert("Error", "Failed to sign in");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Invalid email or password");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const textColor = switchEnabled ? "text-black" : "text-white";
  const inputBgColor = switchEnabled ? "bg-gray-900" : "bg-white";
  const inputTextColor = switchEnabled ? "text-white" : "text-black";

  // Dynamic styles with increased sizes and reduced spacing
  const dynamicStyles = {
    container: {
      paddingHorizontal: getResponsivePadding(20), // Increased from 16
      paddingVertical: getResponsivePadding(16), // Reduced from 24
    },
    header: {
      marginTop: getResponsiveSize(20), // Reduced from 32
      marginBottom: getResponsiveSize(20), // Reduced from 32
      paddingHorizontal: getResponsivePadding(20),
    },
    logo: {
      width: getResponsiveSize(80), // Increased from 64
      height: getResponsiveSize(80), // Increased from 64
      marginRight: getResponsiveSize(16), // Increased from 12
    },
    title: {
      fontSize: getResponsiveSize(48), // Increased from 36
    },
    iconButton: {
      padding: getResponsivePadding(16), // Increased from 12
    },
    iconSize: getResponsiveSize(28), // Increased from 24
    subtitle: {
      fontSize: getResponsiveSize(22), // Increased from 18
      marginBottom: getResponsiveSize(24), // Reduced from 32
    },
    mainCard: {
      width: Math.min(screenData.width * 0.85, 900), // Increased width from 0.9 to 0.85, max from 800 to 900
      padding: getResponsivePadding(40), // Increased from 32
      marginBottom: getResponsiveSize(30), // Reduced from 48
      borderRadius: getResponsiveSize(20), // Increased from 16
    },
    cardTitle: {
      fontSize: getResponsiveSize(36), // Increased from 28
      marginBottom: getResponsiveSize(32), // Increased from 24
    },
    inputContainer: {
      marginBottom: getResponsiveSize(28), // Increased from 24
      width: "100%",
    },
    inputLabel: {
      fontSize: getResponsiveSize(18), // Increased from 16
      marginBottom: getResponsiveSize(10), // Increased from 8
    },
    input: {
      height: getResponsiveSize(64), // Increased from 56
      paddingHorizontal: getResponsivePadding(24), // Increased from 20
      paddingRight: getResponsivePadding(64), // Increased from 56
      fontSize: getResponsiveSize(18), // Increased from 16
      borderRadius: getResponsiveSize(16), // Increased from 12
    },
    inputIcon: {
      right: getResponsivePadding(24), // Increased from 20
      top: getResponsiveSize(18), // Increased from 15
    },
    submitButton: {
      height: getResponsiveSize(64), // Increased from 56
      borderRadius: getResponsiveSize(16), // Increased from 12
      marginBottom: getResponsiveSize(28), // Increased from 24
    },
    submitButtonText: {
      fontSize: getResponsiveSize(22), // Increased from 18
    },
    linkText: {
      fontSize: getResponsiveSize(18), // Increased from 16
    },
    featureCard: {
      minWidth: Math.max(screenData.width * 0.28, 280), // Increased from 0.25 and 250
      padding: getResponsivePadding(28), // Increased from 24
      borderRadius: getResponsiveSize(16), // Increased from 12
    },
    featureIcon: {
      width: getResponsiveSize(56), // Increased from 48
      height: getResponsiveSize(56), // Increased from 48
    },
    featureTitle: {
      fontSize: getResponsiveSize(18), // Increased from 16
    },
    featureDescription: {
      fontSize: getResponsiveSize(16), // Increased from 14
    },
  };

  return (
    <LinearGradient 
      colors={switchEnabled ? ["#232526", "#414345"] : ["#064E41", "#3D8C45"]} 
      style={tw`flex-1`}
    >
      <SafeAreaView style={tw`flex-1`}>
        <ScrollView
          contentContainerStyle={[tw`flex-grow items-center justify-center`, dynamicStyles.container]}
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
                style={[tw`mr-3`, dynamicStyles.logo]}
                source={require("../../assets/Logo-Transparent.png")}
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
            <Text
              style={[
                tw`text-white/80 text-center`,
                { 
                  fontSize: dynamicStyles.subtitle.fontSize,
                  marginBottom: dynamicStyles.subtitle.marginBottom,
                  maxWidth: screenData.width * 0.85
                }
              ]}
            >
              Welcome back! Sign in to access your personalized research experience
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
              Sign In
            </Text>

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
              <View style={tw`relative w-full`}>
                <TextInput
                  style={[
                    tw.style(
                      `w-full shadow-lg`,
                      inputBgColor,
                      inputTextColor
                    ),
                    {
                      height: dynamicStyles.input.height,
                      paddingHorizontal: dynamicStyles.input.paddingHorizontal,
                      paddingRight: dynamicStyles.input.paddingRight,
                      fontSize: dynamicStyles.input.fontSize,
                      borderRadius: dynamicStyles.input.borderRadius,
                    }
                  ]}
                  onChangeText={setEmail}
                  value={email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onSubmitEditing={handleSubmit}
                  placeholder="Enter your email"
                  placeholderTextColor={switchEnabled ? "#999" : "#666"}
                />
                <View style={[
                  tw`absolute`,
                  {
                    right: dynamicStyles.inputIcon.right,
                    top: dynamicStyles.inputIcon.top,
                  }
                ]}>
                  <Ionicons name="mail-outline" size={dynamicStyles.iconSize} color={switchEnabled ? "#999" : "#666"} />
                </View>
              </View>
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
              <View style={tw`relative w-full`}>
                <TextInput
                  style={[
                    tw.style(
                      `w-full shadow-lg`,
                      inputBgColor,
                      inputTextColor
                    ),
                    {
                      height: dynamicStyles.input.height,
                      paddingHorizontal: dynamicStyles.input.paddingHorizontal,
                      paddingRight: dynamicStyles.input.paddingRight,
                      fontSize: dynamicStyles.input.fontSize,
                      borderRadius: dynamicStyles.input.borderRadius,
                    }
                  ]}
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry={!showPassword}
                  onSubmitEditing={handleSubmit}
                  placeholder="Enter your password"
                  placeholderTextColor={switchEnabled ? "#999" : "#666"}
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
                    size={dynamicStyles.iconSize}
                    color={switchEnabled ? "#999" : "#666"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <View style={[tw`w-full flex flex-row justify-end`, { marginBottom: dynamicStyles.inputContainer.marginBottom }]}>
              <TouchableOpacity
                onPress={() => navigation.navigate("RequestResetPasswordPage")}
              >
                <Text style={[
                  tw`text-blue-200 text-right font-medium hover:text-blue-100`,
                  { fontSize: dynamicStyles.linkText.fontSize }
                ]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
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
                Sign In
              </Text>
            </TouchableOpacity>

            {/* Sign-Up Link */}
            <View style={tw`flex-row justify-center items-center w-full`}>
              <Text style={[
                tw`text-white/80`,
                { fontSize: dynamicStyles.linkText.fontSize }
              ]}>
                New Member? 
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("AuthenticationSignUpPage")}> 
                <Text style={[
                  tw`text-blue-200 font-semibold underline hover:text-blue-100 ml-1`,
                  { fontSize: dynamicStyles.linkText.fontSize }
                ]}>
                  Register For Free
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features Section */}
          <View style={{ width: Math.min(screenData.width * 0.95, 1300) }}>
            <View style={tw`flex-row justify-between items-center flex-wrap gap-4`}>
              <View style={[
                tw`flex-1 bg-white/10 backdrop-blur-sm`,
                {
                  minWidth: dynamicStyles.featureCard.minWidth,
                  padding: dynamicStyles.featureCard.padding,
                  borderRadius: dynamicStyles.featureCard.borderRadius,
                }
              ]}> 
                <View style={[
                  tw`bg-[#57B360]/20 rounded-full items-center justify-center mx-auto mb-3`,
                  {
                    width: dynamicStyles.featureIcon.width,
                    height: dynamicStyles.featureIcon.height,
                  }
                ]}>
                  <Ionicons name="library-outline" size={dynamicStyles.iconSize} color="white" />
                </View>
                <Text style={[
                  tw`text-white font-bold mb-2 text-center`,
                  { fontSize: dynamicStyles.featureTitle.fontSize }
                ]}>
                  Access thousands of papers
                </Text>
                <Text style={[
                  tw`text-white/70 text-center`,
                  { fontSize: dynamicStyles.featureDescription.fontSize }
                ]}>
                  Discover research from top institutions worldwide
                </Text>
              </View>

              <View style={[
                tw`flex-1 bg-white/10 backdrop-blur-sm`,
                {
                  minWidth: dynamicStyles.featureCard.minWidth,
                  padding: dynamicStyles.featureCard.padding,
                  borderRadius: dynamicStyles.featureCard.borderRadius,
                }
              ]}> 
                <View style={[
                  tw`bg-[#57B360]/20 rounded-full items-center justify-center mx-auto mb-3`,
                  {
                    width: dynamicStyles.featureIcon.width,
                    height: dynamicStyles.featureIcon.height,
                  }
                ]}>
                  <Ionicons name="person-outline" size={dynamicStyles.iconSize} color="white" />
                </View>
                <Text style={[
                  tw`text-white font-bold mb-2 text-center`,
                  { fontSize: dynamicStyles.featureTitle.fontSize }
                ]}>
                  Personalized experience
                </Text>
                <Text style={[
                  tw`text-white/70 text-center`,
                  { fontSize: dynamicStyles.featureDescription.fontSize }
                ]}>
                  Get recommendations based on your interests
                </Text>
              </View>

              <View style={[
                tw`flex-1 bg-white/10 backdrop-blur-sm`,
                {
                  minWidth: dynamicStyles.featureCard.minWidth,
                  padding: dynamicStyles.featureCard.padding,
                  borderRadius: dynamicStyles.featureCard.borderRadius,
                }
              ]}> 
                <View style={[
                  tw`bg-[#57B360]/20 rounded-full items-center justify-center mx-auto mb-3`,
                  {
                    width: dynamicStyles.featureIcon.width,
                    height: dynamicStyles.featureIcon.height,
                  }
                ]}>
                  <Ionicons name="people-outline" size={dynamicStyles.iconSize} color="white" />
                </View>
                <Text style={[
                  tw`text-white font-bold mb-2 text-center`,
                  { fontSize: dynamicStyles.featureTitle.fontSize }
                ]}>
                  Discover & Connect
                </Text>
                <Text style={[
                  tw`text-white/70 text-center`,
                  { fontSize: dynamicStyles.featureDescription.fontSize }
                ]}>
                  Connect with researchers and share insights
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AuthenticationSignInPage;
