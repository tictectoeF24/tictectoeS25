import React, { useEffect, useState } from 'react';
import {
    View, TextInput, TouchableOpacity, Text, ScrollView,
    Alert, Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateProfile } from '../../api';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';
import { checkIfLoggedIn } from './functions/checkIfLoggedIn';

export default function EditProfilePage() {
    const navigation = useNavigation();
    const route = useRoute();
    const { onUpdate } = route.params;

    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    useEffect(() => {
        setTimeout(async () => {
            const isLoggedIn = await checkIfLoggedIn();
        }, 100);
    }, [])
    const handleUpdate = async () => {
        try {
            const profileData = { username, name, email, bio };
            const response = await updateProfile(profileData);

            Alert.alert('Success', 'Profile updated successfully');


            if (onUpdate) {
                onUpdate(profileData);
            }


            navigation.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
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
        <LinearGradient colors={['#064E41', '#3D8C45']} style={tw`flex-1`}>
            <ScrollView contentContainerStyle={tw`flex-1 justify-center items-center px-6`}>
                <View style={tw`w-full max-w-md bg-white rounded-xl p-5 shadow-lg mb-10`}>
                    {/* Profile Image Section */}
                    <View style={tw`items-center mb-8`}>
                        <TouchableOpacity onPress={pickImage}>
                            {profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={tw`w-24 h-24 rounded-full`}
                                />
                            ) : (
                                <View style={tw`w-24 h-24 rounded-full bg-gray-200 items-center justify-center`}>
                                    <Text style={tw`text-gray-600`}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={tw`mt-2 text-lg text-gray-700`}>Change Profile Picture</Text>
                    </View>

                    {/* Username Input */}
                    <TextInput
                        placeholder="Username"
                        placeholderTextColor="#888"
                        value={username}
                        onChangeText={setUsername}
                        style={tw`border-b mb-4 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    {/* Name Input */}
                    <TextInput
                        placeholder="Name"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        style={tw`border-b mb-4 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    {/* Email Input */}
                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        style={tw`border-b mb-4 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    {/* Bio Input */}
                    <TextInput
                        placeholder="Bio"
                        placeholderTextColor="#888"
                        value={bio}
                        onChangeText={setBio}
                        style={tw`border-b mb-8 text-base p-2 border-gray-300 rounded-lg bg-gray-100`}
                    />

                    {/* Update Button */}
                    <TouchableOpacity
                        onPress={handleUpdate}
                        style={tw`bg-green-600 p-3 rounded-lg items-center`}
                    >
                        <Text style={tw`text-white text-base font-semibold`}>Update Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}
