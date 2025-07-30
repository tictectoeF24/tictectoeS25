import AsyncStorage from "@react-native-async-storage/async-storage";
 
export const checkIfLoggedIn = async () => {
    const jwtToken = await AsyncStorage.getItem("jwtToken");
    return jwtToken !== null;
}