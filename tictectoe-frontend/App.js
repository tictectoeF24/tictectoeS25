import "react-native-gesture-handler";
import React from "react";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

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
import NotesScreen from "./src/components/PaperNotesPage.web";
import ListenPage from "./src/components/ListenPage";
import ViewAuthorPage from "./src/components/ViewAuthorPage";
import LikesScreen from "./src/components/LikesScreen";
import CommentsScreen from "./src/components/CommentsScreen";
import SearchUsersPage from "./src/components/SearchUsersPage";
import TagScreen from "./src/components/TagScreen";
import SubInterestPage from "./src/components/SubInterestPage";
import ChatHistory from "./src/components/ChatHistory";
import RecommendedPapersScreen from "./src/components/RecommendedPapersScreen";
import GuestExplorePage from "./src/components/GuestExplorePage";
import MiniPlayer from "./src/components/MiniPlayer";

import { AudioProvider } from "./src/contexts/AudioContext";

const Stack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
      // Keeps audio state available across the app.
      <AudioProvider>
        {/* Main navigation container used throughout the mobile app. */}
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
              initialRouteName="GuestExplorePage"
              screenOptions={{
                headerShown: false,
                animationEnabled: false,
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
            <Stack.Screen name="LandingPage" component={LandingPage} />
            <Stack.Screen name="ProfilePage" component={ProfilePage} />
            <Stack.Screen
                name="RecommendedPapersScreen"
                component={RecommendedPapersScreen}
            />
            <Stack.Screen name="Explore" component={ExplorePage} />
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
            <Stack.Screen name="EditProfilePage" component={EditProfilePage} />
            <Stack.Screen name="ListenPage" component={ListenPage} />
            <Stack.Screen
                name="PaperNavigationPage"
                component={PaperNavigationPage}
            />
            <Stack.Screen name="PaperNotesPage" component={NotesScreen} />
            <Stack.Screen name="TagScreen" component={TagScreen} />
            <Stack.Screen name="ViewAuthorPage" component={ViewAuthorPage} />
            <Stack.Screen name="BookmarksScreen" component={BookmarksScreen} />
            <Stack.Screen name="LikesScreen" component={LikesScreen} />
            <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
            <Stack.Screen name="SubInterestPage" component={SubInterestPage} />
            <Stack.Screen
                name="SearchUsersPage"
                component={SearchUsersPage}
            />
            <Stack.Screen name="ChatHistory" component={ChatHistory} />
          </Stack.Navigator>

          {/* Persistent player shown above app screens when audio is active. */}
          <MiniPlayer />
        </NavigationContainer>
      </AudioProvider>
  );
}