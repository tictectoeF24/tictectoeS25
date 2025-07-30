import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons, FontAwesome } from 'react-native-vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';
import styles from '../styles/ProfilePageStyles.web';
import { useNavigation } from '@react-navigation/native';


import { fetchProfile, signOut, updateProfile, fetchFollowers, fetchFollowing, followUser, unfollowUser, checkIfFollowing } from '../../api';
import { update } from 'lodash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIfLoggedIn } from './functions/checkIfLoggedIn';

export function ProfilePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const usernameRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const bioRef = useRef(null);
  const profileImageRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followingStatusMap, setFollowingStatusMap] = useState({});

  useEffect(() => {
    setTimeout(async () => {
      const isLoggedIn = await checkIfLoggedIn();
    }, 100);
  }, [])
  // Toggle dark mode
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const getProfile = async () => {
    try {
      const response = await fetchProfile();
      setUsername(response.username);
      setName(response.name);
      setEmail(response.email);
      setBio(response.bio);
      setProfileImage(response.profileImage);
      const followersData = await fetchFollowers(response.id);
      const followingData = await fetchFollowing(response.id);
      setFollowers(followersData || []);
      setFollowing(followingData || []);

      const followStatus = {};
      for (let user of followingData) {
        followStatus[user.id] = true;
      }
      setFollowingStatusMap(followStatus);
    } catch (error) {
      if (error?.message == "Invalid token") {
        signOut();
      }
      if (error?.message == "Invalid token") {
        signOut();
      }
      console.error('Error getting profile:', error);
      Alert.alert('Error', error.message || 'Failed to get profile');
    }
  };

  useEffect(() => {
    getProfile();
  }, [])


  const handleUpdate = async () => {
    setLoading(true);
    try {
      const usernameRefvalue = usernameRef?.current?.value !== "" ? usernameRef?.current?.value : username;
      const nameRefValue = nameRef?.current?.value !== "" ? nameRef?.current?.value : name;
      const emailRefValue = emailRef?.current?.value !== "" ? emailRef?.current?.value : email;
      const bioRefValue = bioRef?.current?.value !== "" ? bioRef?.current?.value : bio;

      const profileData = {
        username: usernameRefvalue,
        name: nameRefValue,
        email: emailRefValue,
        bio: bioRefValue
      };
      const response = await updateProfile(profileData)
      setLoading(false);
      // setIsEditMode(false);


      if (response.message === "Profile updated successfully") {
        getProfile();
        alert("Successfully updated");
      }
      // alert('Success', 'Profile updated successfully');


      // if (onUpdate) {
      //   onUpdate(profileData);
      // }


      // navigation.goBack();
    } catch (error) {
      if (error?.message == "Invalid token") {
        signOut();
      }
      if (error?.message == "Invalid token") {
        signOut();
      }
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      if (followingStatusMap[userId]) {
        await unfollowUser(userId);
        setFollowing((prev) => prev.filter((user) => user.id !== userId));
      } else {
        await followUser(userId);

        const followedUser = followers.find((user) => user.id === userId);
        if (followedUser) {
          setFollowing((prevFollowing) => [...prevFollowing, followedUser]);
        } else {
          setFollowing((prevFollowing) => [...prevFollowing, { id: userId, name: "New User" }]);
        }
      }
      setFollowingStatusMap((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));
    } catch (err) {
      console.error("Follow/unfollow failed", err);
    }
  };



  // Sidebar Component
  const Sidebar = () => (
    <View style={[
      styles.topNav, 
      { 
        backgroundColor: isDarkMode ? '#1E3A34' : '#064E41',
        borderRightWidth: 1,
        borderRightColor: isDarkMode ? '#285F3B' : '#3D8C45'
      }
    ]}>
      <TouchableOpacity 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]} 
        onPress={() => navigation.navigate("BookmarksScreen")}
      >
        <FontAwesome name="bookmark" size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>Bookmarks</Text>
      </TouchableOpacity>
      <View style={[
        styles.navDivider, 
        { backgroundColor: isDarkMode ? '#285F3B' : '#3D8C45', opacity: 0.5 }
      ]} />

      {/* new button for search user page  */}
      <TouchableOpacity 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]} 
        onPress={() => navigation.navigate("SearchUsersPage")}
      >
        <Ionicons name="search-outline" size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>Search Users</Text>
      </TouchableOpacity>
      <View style={[
        styles.navDivider, 
        { backgroundColor: isDarkMode ? '#285F3B' : '#3D8C45', opacity: 0.5 }
      ]} />

      <TouchableOpacity 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]} 
        onPress={() => navigation.navigate("Explore")}
      >
        <FontAwesome name="compass" size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>Explore</Text>
      </TouchableOpacity>
      <View style={[
        styles.navDivider, 
        { backgroundColor: isDarkMode ? '#285F3B' : '#3D8C45', opacity: 0.5 }
      ]} />
      
      <TouchableOpacity 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]} 
        onPress={() => navigation.navigate("LikesScreen")}
      >
        <FontAwesome name="heart" size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>Likes</Text>
      </TouchableOpacity>
      <View style={[
        styles.navDivider, 
        { backgroundColor: isDarkMode ? '#285F3B' : '#3D8C45', opacity: 0.5 }
      ]} />
      
      <TouchableOpacity 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]} 
        onPress={() => navigation.navigate("CommentsScreen")}
      >
        <FontAwesome name="comment" size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>Comments</Text>
      </TouchableOpacity>
      <View style={[
        styles.navDivider, 
        { backgroundColor: isDarkMode ? '#285F3B' : '#3D8C45', opacity: 0.5 }
      ]} />
      
      <TouchableOpacity 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]} 
        onPress={() => navigation.navigate("TagScreen")}
      >
        <FontAwesome name="star" size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>Interests</Text>
      </TouchableOpacity>
      <View style={[
        styles.navDivider, 
        { backgroundColor: isDarkMode ? '#285F3B' : '#3D8C45', opacity: 0.5 }
      ]} />

      {/* Toggle Dark Mode */}
      <TouchableOpacity 
        onPress={toggleTheme} 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]}
      >
        <Ionicons name={isDarkMode ? "sunny" : "moon"} size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </Text>
      </TouchableOpacity>
      <View style={[
        styles.navDivider, 
        { backgroundColor: isDarkMode ? '#285F3B' : '#3D8C45', opacity: 0.5 }
      ]} />

      <TouchableOpacity 
        onPress={() => signOut()} 
        style={[
          styles.navItem, 
          { 
            backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
            borderWidth: 1,
            borderColor: isDarkMode ? '#444' : '#e0e0e0'
          }
        ]}
      >
        <Ionicons name="log-out-outline" size={24} color={isDarkMode ? '#7CC288' : '#064E41'} />
        <Text style={[
          styles.navItemText, 
          { color: isDarkMode ? '#7CC288' : '#064E41' }
        ]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  // Main Content Component
  const MainContent = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ScrollView contentContainerStyle={{
        paddingVertical: 40,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'center',
        maxWidth: 1200,
      }}>
        {/* Title */}
        <Text style={[
          styles.rightColumnHeader,
          isDarkMode ? styles.darkRightColumnHeader : styles.lightRightColumnHeader
        ]}>
          Profile Settings
        </Text>

        {/* Profile Display Container */}
        <View style={[
          styles.profileContainer,
          { 
            width: '100%', 
            maxWidth: 1000,
            backgroundColor: isDarkMode ? 'rgba(30, 58, 52, 0.95)' : 'rgba(240, 248, 241, 0.95)',
            borderWidth: 1,
            borderColor: isDarkMode ? '#285F3B' : '#3D8C45',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
          }
        ]}>
          {/* Profile Header with Image and Info */}
          <View style={[styles.profileHeader, { justifyContent: 'center' }]}>
            {/* Profile Picture Container */}
            <View style={[
              styles.profileImageContainer,
              { 
                width: 160, 
                height: 160,
                backgroundColor: isDarkMode ? '#3A3A3A' : '#f0f0f0',
                borderWidth: 3,
                borderColor: isDarkMode ? '#7CC288' : '#3D8C45',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }
            ]}>
              <Text style={{
                fontSize: 56,
                color: isDarkMode ? '#7CC288' : '#064E41',
              }}>
                👤
              </Text>
            </View>

            {/* Profile Details */}
            <View style={[styles.profileDetailsContainer, { maxWidth: 650 }]}>
              {/* Username and Edit Button */}
              <View style={styles.profileNameContainer}>
                <Text style={[
                  styles.profileUsername,
                  isDarkMode ? styles.darkProfileUsername : styles.lightProfileUsername,
                  { fontSize: 32 }
                ]}>
                  {username}
                </Text>
                
                {!isEditMode && (
                  <TouchableOpacity
                    style={[
                      styles.editProfileButton,
                      isDarkMode ? styles.darkEditProfileButton : styles.lightEditProfileButton
                    ]}
                    onPress={async () => {
                      if (loading) return;
                      setLoading(true);
                      setIsEditMode(true);
                      if (!username) await getProfile();
                      setLoading(false);
                    }}
                  >
                    <Text style={[
                      styles.editProfileButtonText,
                      isDarkMode ? styles.darkEditProfileButtonText : styles.lightEditProfileButtonText
                    ]}>
                      Edit Profile
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Followers / Following Stats */}
              <View style={styles.statsContainer}>
                <TouchableOpacity onPress={() => setShowFollowersModal(true)} style={styles.statItem}>
                  <Text style={[
                    styles.statCount,
                    isDarkMode ? styles.darkStatCount : styles.lightStatCount,
                    { fontSize: 26 }
                  ]}>
                    {followers.length}
                  </Text>
                  <Text style={[
                    styles.statLabel,
                    isDarkMode ? styles.darkStatLabel : styles.lightStatLabel,
                    { fontSize: 16 }
                  ]}>
                    Followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFollowingModal(true)} style={styles.statItem}>
                  <Text style={[
                    styles.statCount,
                    isDarkMode ? styles.darkStatCount : styles.lightStatCount,
                    { fontSize: 26 }
                  ]}>
                    {following.length}
                  </Text>
                  <Text style={[
                    styles.statLabel,
                    isDarkMode ? styles.darkStatLabel : styles.lightStatLabel,
                    { fontSize: 16 }
                  ]}>
                    Following
                  </Text>
                </TouchableOpacity>
              </View>

              {/* User Info - Name, Email, Bio */}
              <View style={styles.userInfoContainer}>
                <Text style={[
                  styles.userInfoItem,
                  isDarkMode ? styles.darkUserInfoItem : styles.lightUserInfoItem,
                  { fontSize: 18, marginBottom: 12 }
                ]}>
                  <Text style={[
                    styles.userInfoLabel,
                    isDarkMode ? styles.darkUserInfoLabel : styles.lightUserInfoLabel
                  ]}>
                    Name: 
                  </Text> {name}
                </Text>
                <Text style={[
                  styles.userInfoItem,
                  isDarkMode ? styles.darkUserInfoItem : styles.lightUserInfoItem,
                  { fontSize: 18, marginBottom: 12 }
                ]}>
                  <Text style={[
                    styles.userInfoLabel,
                    isDarkMode ? styles.darkUserInfoLabel : styles.lightUserInfoLabel
                  ]}>
                    Email: 
                  </Text> {email}
                </Text>
                <Text style={[
                  styles.userInfoItem,
                  styles.userBio,
                  isDarkMode ? styles.darkUserBio : styles.lightUserBio,
                  { fontSize: 18 }
                ]}>
                  <Text style={[
                    styles.userInfoLabel,
                    isDarkMode ? styles.darkUserInfoLabel : styles.lightUserInfoLabel
                  ]}>
                    Bio: 
                  </Text> {bio || "No bio added"}
                </Text>
              </View>
            </View>
          </View>

          {/* Edit Form Fields */}
          {isEditMode && (
            <View style={{ width: '100%', alignItems: 'center', maxWidth: 800, alignSelf: 'center' }}>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    fontSize: 18, 
                    padding: 18,
                    backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#444' : '#d0d0d0',
                    color: isDarkMode ? 'white' : '#333',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }
                ]}
                placeholder="Username"
                placeholderTextColor={isDarkMode ? "#999" : "#888"}
                ref={usernameRef}
                defaultValue={username}
              />
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    fontSize: 18, 
                    padding: 18,
                    backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#444' : '#d0d0d0',
                    color: isDarkMode ? 'white' : '#333',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }
                ]}
                placeholder="Name"
                ref={nameRef}
                placeholderTextColor={isDarkMode ? "#999" : "#888"}
                defaultValue={name}
              />
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    fontSize: 18, 
                    padding: 18,
                    backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#444' : '#d0d0d0',
                    color: isDarkMode ? 'white' : '#333',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }
                ]}
                placeholder="Email"
                ref={emailRef}
                placeholderTextColor={isDarkMode ? "#999" : "#888"}
                defaultValue={email}
              />
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    fontSize: 18, 
                    padding: 18, 
                    minHeight: 120,
                    backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#444' : '#d0d0d0',
                    color: isDarkMode ? 'white' : '#333',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }
                ]}
                placeholder="Bio"
                ref={bioRef}
                placeholderTextColor={isDarkMode ? "#999" : "#888"}
                defaultValue={bio}
                multiline={true}
                numberOfLines={3}
              />
            </View>
          )}

          {/* Edit/Cancel Buttons */}
          {isEditMode && (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <TouchableOpacity 
                style={[
                  styles.editButton, 
                  isDarkMode ? styles.darkEditButton : styles.lightEditButton,
                  { width: 240, padding: 16 }
                ]} 
                onPress={handleUpdate}
              >
                <Text style={[styles.editButtonText, { fontSize: 18 }]}>{loading ? "Loading..." : "Save Changes"}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.cancelButton, 
                  isDarkMode ? styles.darkCancelButton : styles.lightCancelButton,
                  { width: 240, padding: 16, marginTop: 16 }
                ]} 
                onPress={() => setIsEditMode(false)}
              >
                <Text style={[styles.editButtonText, { fontSize: 18 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <LinearGradient
      colors={isDarkMode ? ['#121212', '#121212'] : ['#064E41', '#3D8C45']}
      style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}
    >
      {/* Title Bar */}
      <LinearGradient
        colors={isDarkMode ? ['#1E3A34', '#1E3A34'] : ['rgba(6,78,65,1)', 'rgba(61,140,69,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.titleBar, isDarkMode ? styles.darkTitleBar : styles.lightTitleBar]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Explore")}
          style={tw`absolute left-5 top-5 p-2 rounded-full bg-white`}
        >
          <Ionicons name="arrow-back" size={24} color="#064E41" />
        </TouchableOpacity>
        <Image style={styles.logoStyle} source={require("../../assets/Logo-Transparent.png")} />
        <Text style={styles.titleText}>Tic Tec Toe</Text>
      </LinearGradient>

      {/* Main Layout (Left Navigation + Right Content) */}
      <View style={styles.mainContent}>
        {/* Left Column - Side Navigation Bar */}
        <Sidebar />

        {/* Divider between side navigation and content */}
        <View style={[styles.divider, isDarkMode ? styles.darkDivider : styles.lightDivider]}></View>

        {/* Content area with modals and main content side by side */}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Left modal - Followers */}
          {showFollowersModal && (
            <View style={[
              styles.followModal,
              { 
                width: 320,
                marginTop: 110,
                marginLeft: 20,
                height: 500,
                overflowY: 'auto',
                backgroundColor: isDarkMode ? 'rgba(30, 58, 52, 0.95)' : 'rgba(240, 248, 241, 0.95)',
                borderWidth: 1,
                borderColor: isDarkMode ? '#285F3B' : '#3D8C45',
                padding: 20,
                position: 'relative',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 5
              }
            ]}>
              {/* Header with title and close button */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#285F3B' : '#3D8C45',
                paddingBottom: 10,
                marginBottom: 15
              }}>
                <Text style={{
                  color: isDarkMode ? '#7CC288' : '#064E41',
                  fontWeight: 'bold',
                  fontSize: 24
                }}>
                  Followers
                </Text>
                
                <TouchableOpacity 
                  onPress={() => setShowFollowersModal(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: '#b00020',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 16,
                    textAlign: 'center'
                  }}>
                    X
                  </Text>
                </TouchableOpacity>
              </View>
              
              {followers.length > 0 ? (
                followers.map((user) => (
                  <View 
                    key={user.id} 
                    style={[
                      styles.followUserItem,
                      { 
                        backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                        borderWidth: 1, 
                        borderColor: isDarkMode ? '#444' : '#ccc', 
                        marginBottom: 10,
                        borderRadius: 8
                      }
                    ]}
                  >
                    <Text style={[
                      styles.followUserName,
                      { color: isDarkMode ? 'white' : '#333' }
                    ]}>
                      {user.name}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => handleFollowToggle(user.id)}
                      style={
                        followingStatusMap[user.id] 
                          ? { backgroundColor: '#b00020', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 }
                          : { backgroundColor: '#057B34', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 }
                      }
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                        {followingStatusMap[user.id] ? 'Unfollow' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={[
                  styles.emptyStateContainer,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                    borderWidth: 1, 
                    borderColor: isDarkMode ? '#444' : '#ccc',
                    borderRadius: 8
                  }
                ]}>
                  <Text style={[
                    styles.emptyStateText,
                    { color: isDarkMode ? '#BBB' : '#555' }
                  ]}>
                    You have no followers yet.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Main content */}
          <MainContent />

          {/* Right modal - Following */}
          {showFollowingModal && (
            <View style={[
              styles.followModal,
              { 
                width: 320,
                marginTop: 110,
                marginRight: 20,
                height: 500,
                overflowY: 'auto',
                backgroundColor: isDarkMode ? 'rgba(30, 58, 52, 0.95)' : 'rgba(240, 248, 241, 0.95)',
                borderWidth: 1,
                borderColor: isDarkMode ? '#285F3B' : '#3D8C45',
                padding: 20,
                position: 'relative',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 5
              }
            ]}>
              {/* Header with title and close button */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#285F3B' : '#3D8C45',
                paddingBottom: 10,
                marginBottom: 15
              }}>
                <Text style={{
                  color: isDarkMode ? '#7CC288' : '#064E41',
                  fontWeight: 'bold',
                  fontSize: 24
                }}>
                  Following
                </Text>
                
                <TouchableOpacity 
                  onPress={() => setShowFollowingModal(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: '#b00020',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 16,
                    textAlign: 'center'
                  }}>
                    X
                  </Text>
                </TouchableOpacity>
              </View>
              
              {following.length > 0 ? (
                following.map((user) => (
                  <View 
                    key={user.id} 
                    style={[
                      styles.followUserItem,
                      { 
                        backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                        borderWidth: 1, 
                        borderColor: isDarkMode ? '#444' : '#ccc', 
                        marginBottom: 10,
                        borderRadius: 8
                      }
                    ]}
                  >
                    <Text style={[
                      styles.followUserName,
                      { color: isDarkMode ? 'white' : '#333' }
                    ]}>
                      {user.name}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => handleFollowToggle(user.id)}
                      style={{ backgroundColor: '#b00020', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Unfollow</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={[
                  styles.emptyStateContainer,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                    borderWidth: 1, 
                    borderColor: isDarkMode ? '#444' : '#ccc',
                    borderRadius: 8
                  }
                ]}>
                  <Text style={[
                    styles.emptyStateText,
                    { color: isDarkMode ? '#BBB' : '#555' }
                  ]}>
                    You're not following anyone yet.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}
