import { StyleSheet } from "react-native";

export const filterPageStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    marginTop: 30, 
    paddingHorizontal: 15, 
    paddingTop: 30, 
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15, 
    color: "#fff", 
    textAlign: "center", // Center align the section title
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12, 
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Translucent white background for gradient contrast
    borderRadius: 10,  
    paddingHorizontal: 20,  
    paddingVertical: 12,   
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,               
  },
  filterOptionText: {
    marginLeft: 15, 
    fontSize: 16,
    color: "#fff", // White text for better contrast
  },
  applyButton: {
    marginTop: 20, // Add space above the button
    backgroundColor: "#57B360",
    paddingVertical: 15, 
    paddingHorizontal: 20, 
    borderRadius: 10,  
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5, 
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
