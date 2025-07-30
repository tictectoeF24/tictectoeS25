export const isTokenExpired = (error) => {
    if (!error) {
        console.log("No error provided");
        return;
    }
    if (error?.response?.data?.message == "Invalid or expired token") {
        alert("Your session has expired. Please log in again.");
        return true;
    } else {
        return false;
    }

};