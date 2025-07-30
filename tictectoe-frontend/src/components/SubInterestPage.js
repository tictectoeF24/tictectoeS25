import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { Image } from "react-native";


const SubInterestPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [initialParams] = useState(() => route.params || {});
  const {
    mainCategory = "",
    subInterests = [],
    selectedInterests = [],
    switchEnabled = false,
  } = initialParams;

  const [localSelected, setLocalSelected] = useState(
    subInterests.filter((sub) => selectedInterests.includes(sub))
  );

  const toggleLocalInterest = (interest) => {
    setLocalSelected((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((item) => item !== interest);
      }
      return [...prev, interest];
    });
  };

  const handleOk = () => {
    const updatedInterests = [
      ...selectedInterests.filter((sub) => !subInterests.includes(sub)),
      ...localSelected,
    ];
    navigation.navigate("AuthenticationSignUpPage", { updatedInterests });
  };

  const textColor = switchEnabled ? "text-black" : "text-white";

  return (
    <LinearGradient colors={["#064E41", "#3D8C45"]} style={tw`flex-1 py-10 px-6`}>
      <SafeAreaView style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`items-center`}>
        <View style={tw`flex-row justify-center items-center mb-6`}

        >
          <Image
            source={require("../../assets/Logo-Transparent.png")}
            style={tw`w-20 h-20`}
          />
          <Text style={tw`font-bold text-3xl text-white ml-2 mr-12`}
            onPress={() => navigation.navigate("LandingPage")}
          >
            Tic Tec Toe
          </Text>
        </View>
          <Text style={tw`text-2xl font-bold mb-4 text-white text-center`}>
            Select Subcategories for {mainCategory}
          </Text>

          <View style={tw`flex-row flex-wrap justify-center mb-4`}>
            {subInterests.map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => toggleLocalInterest(sub)}
                style={[tw`m-1 px-3 py-2 rounded-full`, {
                  backgroundColor: localSelected.includes(sub)
                    ? "#57B360"
                    : switchEnabled ? "#2a2a2a" : "#ffffff",
                }]}
              >
                <Text style={[tw`text-sm`, {
                  color: localSelected.includes(sub)
                    ? "#ffffff"
                    : switchEnabled ? "#ffffff" : "#000000",
                }]}> {sub} </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleOk}
            style={tw`mt-4 w-40 h-12 bg-[#57B360] rounded-lg justify-center items-center`}
          >
            <Text style={tw`text-white font-bold text-lg`}>OK</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SubInterestPage;
