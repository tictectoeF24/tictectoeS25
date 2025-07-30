import { Text, View, SafeAreaView, TouchableOpacity, Switch, Modal, TextInput, FlatList, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw, { useDeviceContext, useAppColorScheme } from 'twrnc';
import { Ionicons, FontAwesome, AntDesign } from 'react-native-vector-icons';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { updatePrivacySettings } from '../../api';
 
const ViewAuthorPage = () => {
    const getAuthorName = () => {
        return "Author Name"
    };
  return (
    <LinearGradient
      colors={['#064E41', '#3D8C45']}
      style={tw`flex flex-col flex-1 h-full w-full`}
    >
        <SafeAreaView>
            <View style={tw`m-10 items-center`}>
               
                <Ionicons name="person-circle-outline" size={100} style={tw`mb-2 mt-10`} />
                <Text style={tw`text-4xl`}>{getAuthorName()}</Text>
                <Text style={tw`mb-5 text-gray-900`}> Joined Sept. 2023</Text>
                <View style={tw`bg-green-950 p-3 rounded-10 shadow-lg mb-5`}>
                    <Text style={tw`text-gray-400`}>#Computer Science</Text>
                </View>
                <View>
                    <Text style={tw`text-lg text-center`}>About the Author</Text>
                    <Text style={tw`text-gray-900`}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at sollicitudin sapien, sed varius sapien. Vestibulum porta lacinia vehicula. Aliquam sodales, sem et pulvinar convallis, turpis ante consectetur mi, at ornare magna tellus id odio.</Text>
                </View>
                <View style={tw`mt-5 w-full`}>
                    <Text style={tw` text-gray-300 mb-3`}>Papers by Author ↓</Text>
                    <ScrollView style={tw`rounded-2`}>
                        <Text style={tw`bg-green-800 p-2 mb-1`}> Research paper #1 </Text>
                        <Text style={tw`bg-green-800 p-2 mb-1`}> Research paper #2 </Text>
                        <Text style={tw`bg-green-800 p-2 mb-1`}> Research paper #3 </Text>
                        <Text style={tw`bg-green-800 p-2 mb-1`}> Research paper #4 </Text>
                        <Text style={tw`bg-green-800 p-2 mb-1`}> Research paper #N </Text>
                       
                    </ScrollView>
                </View>
 
 
            </View>
        </SafeAreaView>
    </LinearGradient>
   
  );
};
 
export default ViewAuthorPage;