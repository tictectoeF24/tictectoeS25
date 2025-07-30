import { Text, View, SafeAreaView, TouchableOpacity, Switch, Modal, TextInput, FlatList, ScrollView, Alert, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw, { useDeviceContext, useAppColorScheme } from 'twrnc';
import { Ionicons, FontAwesome, AntDesign } from 'react-native-vector-icons';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { updatePrivacySettings, fetchProfile, deleteAuthToken, fetchFollowers, fetchFollowing } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

export function ProfilePage() {
  const navigation = useNavigation();

  // Style for each box and section
  const titleBoxStyle = tw`flex w-full px-5 bg-gray-200`;
  const linkBoxStyle = tw`flex flex-row items-center w-full px-5 py-1`;
  const sectionStyle = tw`flex flex-col w-full pb-3`;

  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: `light`,
  });

  const [colorScheme, toggleColorScheme, setColorScheme] = useAppColorScheme(tw);
  const [isDarkmode, setIsDarkmode] = useState(false);
  const [visibility, setVisibility] = useState('public'); // State for privacy settings
  const [showOrcidLogin, setShowOrcidLogin] = useState(true);
  const [profileData, setProfileData] = useState({
    username: 'your_username',
    name: 'Your Name',
    email: 'xyz@gmail.com',
    bio: 'Your Bio here',
    profileImage: null,
  }); // State for profile data

  // ORCID Credentials
  const BASE_URL = process.env.REACT_APP_API_URL || "https://tictectoe.org";
  const ORCID_CLIENT_ID = "APP-H4ASFRRPPQLEYAAD";
  const ORCID_REDIRECT_URI = `${BASE_URL}/api/profile/auth/orcid/callback`;

  const handleORCIDLogin = () => {
    const orcidAuthURL = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(ORCID_REDIRECT_URI)}`;
    Linking.openURL(orcidAuthURL);
  };

  const [followers, setFollowers] = useState([]); // New: followers state
  const [following, setFollowing] = useState([]); // New: following state


  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");

        if (token) {
          const data = await fetchProfile(token);
          setProfileData(data);
          // Fetch followers and following using backend APIs
          const [followerData, followingData] = await Promise.all([

            fetchFollowers(data.id),
            fetchFollowing(data.id)
          ]);
          setFollowers(followerData);
          setFollowing(followingData);
        } else {
          Alert.alert("Error", "No token found, please log in again.");
        }
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to load profile");
      }
    };



    fetchProfileData();
  }, []);

  const switchDarkmode = () => {
    toggleColorScheme();
    setIsDarkmode(!isDarkmode);
  };

  // Function to handle privacy update
  const handleUpdatePrivacy = async () => {
    const newVisibility = visibility === 'public' ? 'private' : 'public';
    try {
      await updatePrivacySettings(newVisibility);
      setVisibility(newVisibility);
      Alert.alert('Success', `Privacy set to ${newVisibility}`);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating privacy settings');
    }
  };

  getUserFollowingNumber = () => {
    return following.length;
  }

  getUserFollowersNum = () => {
    return followers.length
  }

  const [followersVisible, setFollowersVisibility] = useState(false);
  const showFollowersPopup = () => {
    setFollowersVisibility(true);
  }

  const hideFollowersPopup = () => {
    setFollowersVisibility(false);
  }

  const [followingVisible, setFollowingVisibility] = useState(false);
  const showFollowingPopup = () => {
    setFollowingVisibility(true);
  }

  const hideFollowingPopup = () => {
    setFollowingPopup(false);
  }

  // const [unfollowButtonStates, setUnfollowButton] = useState(false);
  // const handlePress = () => {
  //   setUnfollowButton(!unfollowButtonStates);
  // }

  // const fetchFollowers = async () => {
  //   const url = "";
  //   const token = "";

  //   fetch(url), {
  //     headers: {
  //       "Authorization": `Person ${token}`
  //     }
  //   }
  //     .then(response => {
  //       if (!response.ok) {
  //         throw new Error("Network response unavailable");
  //       }
  //       return response;
  //     })
  //     .then((data) => {
  //       setFollowers(data)
  //       setFilteredFollowers(data)
  //     })
  // }
  const signOut = async () => {
    try {

      await AsyncStorage.removeItem("jwtToken");

      deleteAuthToken();

      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirmation",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Logout canceled"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            const success = await signOut();
            if (success) {
              navigation.navigate("GuestExplorePage");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // // temporary "users" (connect to backend later)
  // const followers = [
  //   { id: "1", name: "John", bio: "additional info" },
  //   { id: "2", name: "Bill", bio: "additional info" },
  //   { id: "3", name: "Bartholemew", bio: "additional info" }
  // ]

  // const following = [
  //   { id: "1", name: "John", bio: "additional info" },
  //   { id: "2", name: "Bill", bio: "additional info" },
  //   { id: "3", name: "Jack", bio: "additional info" },
  //   { id: "4", name: "Joe", bio: "additional info" },
  //   { id: "5", name: "Smith", bio: "additional info" },
  // ]

  // manage & filter follwers
  const [searchFollowersInput, setFollowersSearchInput] = useState('');
  const filteredFollowers = followers.filter((item) =>
    // item.name.toLowerCase().includes(searchFollowersInput.toLowerCase())
    item?.name?.toLowerCase?.().includes(searchFollowersInput.toLowerCase())
  );

  const updateFollowersSearchInput = (text) => {
    setFollowersSearchInput(text)
  }

  // manage & filter following
  const [searchFollowingInput, setFollowingSearchInput] = useState('');
  const filteredFollowing = following.filter((item) =>
    // item.name.toLowerCase().includes(searchFollowingInput.toLowerCase())
    item?.name?.toLowerCase?.().includes(searchFollowingInput.toLowerCase())
  );

  const updateFollowingSearchInput = (text) => {
    setFollowingSearchInput(text)
  }

  return (
    <LinearGradient
      colors={isDarkmode ? ['#1E1E1E', '#2A2A2A'] : ['#064E41', '#3D8C45']}
      style={tw`flex-1 w-full`}
    >
      <SafeAreaView style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`items-center pb-4`} showsVerticalScrollIndicator={false}>
          <View style={tw`flex flex-col w-full items-center`}>
            {/* Back Button */}
            <TouchableOpacity
              style={tw`absolute top-0.5 left-5 p-2 rounded-full bg-white`}
              onPress={() => navigation.navigate('Explore')}
            >
              <Ionicons name="arrow-back" size={24} color="#064E41" />
            </TouchableOpacity>
            <Text style={[tw`text-2xl font-bold`, { color: isDarkmode ? '#fff' : '#fff' }]}>Profile</Text>
            <View style={{ width: 28 }} />
            </View>

          <View style={{
            backgroundColor: isDarkmode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            width: '90%',
            marginTop: 30,
            marginBottom: 18,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 6,
          }}>
            <TouchableOpacity onPress={() => Alert.alert('Profile Picture', 'Change Profile Picture')}>
              {profileData.profileImage ? (
                <Image source={{ uri: profileData.profileImage }} style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 10 }} />
              ) : (
                <Ionicons name="person-circle-outline" size={90} color={isDarkmode ? '#fff' : '#057B34'} style={{ marginBottom: 10 }} />
              )}
            </TouchableOpacity>
            <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 20, fontWeight: 'bold', marginBottom: 1 }}>{profileData.name}</Text>
            <Text style={{ color: isDarkmode ? '#aaa' : '#666', fontSize: 15, marginBottom: 1 }}>{profileData.email}</Text>
            <Text style={{ color: isDarkmode ? '#888' : '#999', fontSize: 13, marginBottom: 2 }}>{profileData.bio || 'No Bio Added'}</Text>
            <View style={tw`flex-row justify-center items-center mb-2`}>
              <TouchableOpacity onPress={showFollowersPopup} style={tw`mx-4 items-center`}>
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 16, fontWeight: 'bold' }}>{getUserFollowersNum()}</Text>
                <Text style={{ color: isDarkmode ? '#aaa' : '#666', fontSize: 12 }}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={showFollowingPopup} style={tw`mx-4 items-center`}>
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 16, fontWeight: 'bold' }}>{getUserFollowingNumber()}</Text>
                <Text style={{ color: isDarkmode ? '#aaa' : '#666', fontSize: 12 }}>Following</Text>
              </TouchableOpacity>
            </View>
              </View>

          <View style={tw`w-11/12 mt-5`}>
            <View style={tw`flex-row justify-between mb-3`}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginRight: 8, alignItems: 'center', flexDirection: 'row' }}
                onPress={() => navigation.navigate('EditProfilePage', { profileData, onUpdate: (updatedData) => setProfileData((prev) => ({ ...prev, ...updatedData })) })}
              >
                <FontAwesome name="edit" size={20} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginLeft: 8, alignItems: 'center', flexDirection: 'row' }}
                onPress={() => navigation.navigate('SearchUsersPage')}
              >
                <Ionicons name="search-outline" size={20} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Search Users</Text>
              </TouchableOpacity>
            </View>
            <View style={tw`flex-row justify-between mb-3`}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginRight: 8, alignItems: 'center', flexDirection: 'row' }}
                onPress={switchDarkmode}
              >
                <MaterialIcons name={isDarkmode ? "wb-sunny" : "nightlight-round"} size={22} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Dark Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginLeft: 8, alignItems: 'center', flexDirection: 'row' }}
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={20} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
              {showOrcidLogin && (
                <TouchableOpacity
                style={{ backgroundColor: isDarkmode ? '#057B34' : '#3D8C45', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  onPress={handleORCIDLogin}
                >
                <FontAwesome name="id-badge" size={20} color="#fff" style={tw`mr-2`} />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Login with ORCID</Text>
                </TouchableOpacity>
              )}
            </View>

          <View style={tw`w-11/12 mt-5`}>
            {/* <Text style={{ color: isDarkmode ? '#fff' : '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 18 }}>Preferences</Text> */}
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginRight: 8, alignItems: 'center', flexDirection: 'row' }} onPress={() => navigation.navigate("BookmarksScreen")}>
                <FontAwesome name="bookmark-o" size={20} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Bookmarks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginLeft: 8, alignItems: 'center', flexDirection: 'row' }} onPress={() => navigation.navigate("CommentsScreen")}>
                <FontAwesome name="comment-o" size={20} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Comments</Text>
              </TouchableOpacity>
            </View>
            <View style={tw`flex-row justify-between mt-3`}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginRight: 8, alignItems: 'center', flexDirection: 'row' }} onPress={() => navigation.navigate("LikesScreen")}>
                <FontAwesome name="heart-o" size={20} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Likes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: isDarkmode ? '#232323' : '#fff', borderRadius: 16, padding: 16, marginLeft: 8, alignItems: 'center', flexDirection: 'row' }} onPress={() => navigation.navigate("TagScreen")}>
                <FontAwesome name="star-o" size={20} color={isDarkmode ? '#7CC288' : '#057B34'} style={tw`mr-2`} />
                <Text style={{ color: isDarkmode ? '#fff' : '#222', fontSize: 15, fontWeight: '600' }}>Interests</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
