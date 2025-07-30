import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "../../../api";

export const checkIfLoggedIn = async () => {
    const jwtToken = await AsyncStorage.getItem("jwtToken");
    if (jwtToken === null) {
        signOut();
        return false;
    }
    return true;
}
