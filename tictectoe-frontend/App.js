import "react-native-gesture-handler";
import React from "react";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaView, Button, View, Text } from "react-native";
import ExplorePage from "./src/components/ExplorePage";
import AuthenticationVerifyPage from "./src/components/AuthenticationVerifyPage";
import AuthenticationSignUpPage from "./src/components/AuthenticationSignUpPage";
import AuthenticationSignInPage from "./src/components/AuthenticationSignInPage";
import LandingPage from "./src/components/landingPage";
import { ProfilePage } from "./src/components/ProfilePage";
import RequestResetPasswordPage from "./src/components/RequestResetPasswordPage";
import VerifyResetOtpPage from "./src/components/VerifyResetOtpPage";
import SetNewPasswordPage from "./src/components/SetNewPasswordPage";
import BookmarksScreen from "./src/components/BookmarksScreen";
import EditProfilePage from "./src/components/EditProfilePage";
import PaperNavigationPage from "./src/components/PaperNavigationPage";
import ListenPage from "./src/components/ListenPage";
import ViewAuthorPage from "./src/components/ViewAuthorPage";
import LikesScreen from "./src/components/LikesScreen";
import CommentsScreen from "./src/components/CommentsScreen";
import SearchUsersPage from "./src/components/SearchUsersPage";
import TagScreen from "./src/components/TagScreen";
import SubInterestPage from './src/components/SubInterestPage';

import { AudioProvider } from "./src/contexts/AudioContext";
import MiniPlayer from "./src/components/MiniPlayer";

import ChatHistory from './src/components/ChatHistory';



import GuestExplorePage from "./src/components/GuestExplorePage";



function HomeScreen({ navigation }) {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text>Welcome to Tic Tec Toe App</Text>
      <Button
        title="Go to Authentication Verification Page"
        onPress={() => navigation.navigate("AuthenticationVerifyPage")}
      />
      <Button
        title="Go to SignUp Page"
        onPress={() => navigation.navigate("AuthenticationSignUpPage")}
      />
      <Button
        title="Go to SignIn Page"
        onPress={() => navigation.navigate("AuthenticationSignInPage")}
      />
      <Button
        title="Go to Landing Page"
        onPress={() => navigation.navigate("LandingPage")}
      />
      <Button
        title="Go to Profile Page"
        onPress={() => navigation.navigate("ProfilePage")}
      />
      <Button
        title="Go to Explore Page"
        onPress={() => navigation.navigate("Explore")}
      />
      <Button
        title="Go to navigation page"
        onPress={() => navigation.navigate("PaperNavigationPage")}
      />
      <Button
        title="Go to edit profile page"
        onPress={() => navigation.navigate("EditProfilePage")}
      />
      <Button
        title="Go to Listen page"
        onPress={() => navigation.navigate("ListenPage")}
      />
    </SafeAreaView>
  );
}
const Stack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();
export default function App() {
  return (
    <AudioProvider>
      <NavigationContainer
        ref={navigationRef}
      >
        <Stack.Navigator
          initialRouteName="GuestExplorePage"
          screenOptions={{
            headerShown: false,
            animationEnabled: false
          }}
        >
          <Stack.Screen
            name="GuestExplorePage"
            component={GuestExplorePage}
          />
          <Stack.Screen
            name="AuthenticationSignUpPage"
            component={AuthenticationSignUpPage}
          />
          <Stack.Screen
            name="AuthenticationSignInPage"
            component={AuthenticationSignInPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AuthenticationVerifyPage"
            component={AuthenticationVerifyPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="LandingPage"
            component={LandingPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ProfilePage"
            component={ProfilePage}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Explore"
            component={ExplorePage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RequestResetPasswordPage"
            component={RequestResetPasswordPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VerifyResetOtpPage"
            component={VerifyResetOtpPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SetNewPasswordPage"
            component={SetNewPasswordPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfilePage"
            component={EditProfilePage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ListenPage"
            component={ListenPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaperNavigationPage"
            component={PaperNavigationPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TagScreen"
            component={TagScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ViewAuthorPage"
            component={ViewAuthorPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookmarksScreen"
            component={BookmarksScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LikesScreen"
            component={LikesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CommentsScreen"
            component={CommentsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
          name="SubInterestPage" 
          component={SubInterestPage}
          options={{ headerShown: false }}  
          />
          <Stack.Screen
            name="SearchUsersPage"
            component={SearchUsersPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
          name="ChatHistory"
          component={ChatHistory}
          options={{ headerShown: false }}
        />
        </Stack.Navigator>
        <MiniPlayer />
      </NavigationContainer>
    </AudioProvider>
  );
}