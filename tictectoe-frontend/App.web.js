import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaView, Button, View, Text } from "react-native";
import ExplorePage from "./src/components/ExplorePage";
import AuthenticationVerifyPage from "./src/components/AuthenticationVerifyPage.web";
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
import TagScreen from "./src/components/TagScreen";
import ViewAuthorPage from "./src/components/ViewAuthorPage";
import LikesScreen from "./src/components/LikesScreen";
import CommentsScreen from "./src/components/CommentsScreen";
import GuestExplorePage from "./src/components/GuestExplorePage.web";

import SearchUsersPage from "./src/components/SearchUsersPage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SubInterestPage from './src/components/SubInterestPage';
import { AudioProvider } from "./src/contexts/AudioContext.web";
import MiniPlayer from "./src/components/MiniPlayer.web";
import ChatHistoryPage from './src/components/ChatHistoryPage.web';


const Stack = createStackNavigator();

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
      <Button
        title="Go to Tag Screen"
        onPress={() => navigation.navigate("TagScreen")}
      />
    </SafeAreaView>
  );
}

export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    document.body.style.overflow = "auto";

    const loadRoute = async () => {
      try {
        const savedRoute = await AsyncStorage.getItem("currentRoute");
        if (savedRoute) {
          const jwtToken = await AsyncStorage.getItem("jwtToken");
          if (jwtToken) {
            setCurrentRoute(savedRoute);
          } else {
            setCurrentRoute("GuestExplorePage")
          }
        } else {
          setCurrentRoute("GuestExplorePage");
        }
      } catch (error) {
        console.error("Failed to load route", error);
        setCurrentRoute("GuestExplorePage");
      } finally {
        setIsReady(true);
        const savedRoute = await AsyncStorage.getItem("currentRoute");
        setTimeout(async () => {
          navigationRef.navigate(savedRoute); // Navigate to last route

        }, 200);

      }
    };

    loadRoute();
  }, []);

  useEffect(() => {
    if (isReady && currentRoute) {
      AsyncStorage.setItem("currentRoute", currentRoute);

    }
  }, [currentRoute, isReady]);

  useEffect(() => {
    if (isReady && currentRoute && navigationRef.isReady()) {
      navigationRef.navigate(currentRoute);
      AsyncStorage.setItem("currentRoute", currentRoute);
    }
  }, [isReady, currentRoute]);

  useEffect(() => {
    const init = async () => {
      try {
        await AsyncStorage.removeItem("currentRoute");
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize:", error);
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <AudioProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          if (currentRoute) {
            navigationRef.navigate(currentRoute); // Navigate to last route
          }
        }}
        onStateChange={(state) => {
          const routeName = state?.routes[state.index]?.name;
          if (routeName) {
            setCurrentRoute(routeName); // Update the current route
          }
        }}

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
          />
          <Stack.Screen
            name="AuthenticationVerifyPage"
            component={AuthenticationVerifyPage}
          />
          <Stack.Screen
            name="LandingPage"
            component={LandingPage}
          />
          <Stack.Screen
            name="ProfilePage"
            component={ProfilePage}
          />
          <Stack.Screen
            name="Explore"
            component={ExplorePage}
          />
          <Stack.Screen
            name="RequestResetPasswordPage"
            component={RequestResetPasswordPage}
          />
          <Stack.Screen
            name="VerifyResetOtpPage"
            component={VerifyResetOtpPage}
          />
          <Stack.Screen
            name="SetNewPasswordPage"
            component={SetNewPasswordPage}
          />
          <Stack.Screen
            name="EditProfilePage"
            component={EditProfilePage}
          />
          <Stack.Screen
            name="ListenPage"
            component={ListenPage}
          />
          <Stack.Screen
            name="PaperNavigationPage"
            component={PaperNavigationPage}
          />
          <Stack.Screen
            name="TagScreen"
            component={TagScreen}
          />
          <Stack.Screen
            name="ViewAuthorPage"
            component={ViewAuthorPage}
          />
          <Stack.Screen
            name="BookmarksScreen"
            component={BookmarksScreen}
          />
          <Stack.Screen
            name="LikesScreen"
            component={LikesScreen}
          />
          <Stack.Screen
            name="CommentsScreen"
            component={CommentsScreen}
          />
          <Stack.Screen
            name="SubInterestPage"
            component={SubInterestPage}
          />
          <Stack.Screen
            name="SearchUsersPage"
            component={SearchUsersPage}
          />
          <Stack.Screen
            name="ChatHistoryPage"
            component={ChatHistoryPage}
          />
        </Stack.Navigator>

        <MiniPlayer />
      </NavigationContainer>
    </AudioProvider>
  );
}
 