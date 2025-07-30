export const checkIfGobackInfoAvailable = (navigation) => {
    if (!navigation) {
        console.log("Navigation object is null");
        return false;
    }
    if (navigation.getState().routes.length === 2 && navigation.getState().routes[0].name === "GuestExplorePage") {
        console.log("Info is not available", navigation.getState());
        return false;
    }
    console.log("Info is available", navigation.getState());
    return true;
};