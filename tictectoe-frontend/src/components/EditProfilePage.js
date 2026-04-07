import React, { useEffect, useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    ScrollView,
    Alert,
    Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { updateProfile } from "../../api";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { checkIfGobackInfoAvailable } from "./functions/routeGoBackHandler";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function EditProfilePage() {
    const navigation = useNavigation();
    const route = useRoute();
    const { profileData, onUpdate } = route.params || {};

    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };

    const theme = {
        backgroundColors: isDarkMode
            ? ["#0C1C1A", "#2B5A3E"]
            : ["#064E41", "#57B360"],
        textColor: "#FFFFFF",
    };

    useEffect(() => {
        if (profileData) {
            setUsername(profileData.username ?? "");
            setName(profileData.name ?? "");
            setEmail(profileData.email ?? "");
            setBio(profileData.bio ?? "");
            setProfileImage(profileData.profileImage ?? null);
        }
    }, [profileData]);

    const handleUpdate = async () => {
        try {
            const updatedProfileData = {
                username: username || profileData?.username || "",
                name: name || profileData?.name || "",
                email: email || profileData?.email || "",
                bio: bio || profileData?.bio || "",
            };

            await updateProfile(updatedProfileData);

            Alert.alert("Success", "Profile updated successfully");

            if (onUpdate) {
                onUpdate(updatedProfileData);
            }

            navigation.goBack();
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", error.message || "Failed to update profile");
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    return (
        <LinearGradient colors={theme.backgroundColors} style={tw`flex-1`}>
            <Text
                style={[
                    tw`text-2xl font-bold`,
                    { color: theme.textColor, marginTop: 100, textAlign: "center" },
                ]}
            >
                Edit Profile
            </Text>

            <TouchableOpacity
                onPress={toggleTheme}
                style={{ position: "absolute", marginTop: 105, right: 35 }}
            >
                <MaterialIcons
                    name={isDarkMode ? "wb-sunny" : "nightlight-round"}
                    size={24}
                    color="white"
                />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={tw`flex-1 justify-center items-center px-6 mb-10`}
            >
                <View style={tw`w-full max-w-md bg-white rounded-xl p-5 shadow-lg mb-10`}>
                    <TouchableOpacity
                        onPress={() => {
                            checkIfGobackInfoAvailable(navigation)
                                ? navigation.goBack()
                                : navigation.navigate("Explore");
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#064E41" />
                    </TouchableOpacity>

                    <View style={tw`items-center mb-8`}>
                        <TouchableOpacity onPress={pickImage}>
                            {profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={tw`w-24 h-24 rounded-full`}
                                />
                            ) : (
                                <View
                                    style={tw`w-24 h-24 rounded-full bg-gray-200 items-center justify-center`}
                                >
                                    <Text style={tw`text-gray-600`}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={tw`mt-2 text-lg text-gray-700`}>
                            Change Profile Picture
                        </Text>
                    </View>

                    <TextInput
                        placeholder="Username"
                        placeholderTextColor="#888"
                        value={username}
                        onChangeText={setUsername}
                        style={tw`border-b mb-4 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    <TextInput
                        placeholder="Name"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        style={tw`border-b mb-4 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        style={tw`border-b mb-4 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    <TextInput
                        placeholder="Bio"
                        placeholderTextColor="#888"
                        value={bio}
                        onChangeText={setBio}
                        style={tw`border-b mb-8 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    <TouchableOpacity
                        onPress={handleUpdate}
                        style={tw`bg-green-600 p-3 rounded-lg items-center`}
                    >
                        <Text style={tw`text-white text-base font-semibold`}>
                            Update Profile
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}