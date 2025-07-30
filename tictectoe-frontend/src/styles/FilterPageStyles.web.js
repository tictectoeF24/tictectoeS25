import { StyleSheet } from "react-native";

export const filterPageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#64C896", 
    padding: 20,
    paddingTop: 50
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff", 
  },
  filterContainer: {
    marginTop: 20,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff", 
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "#f9f9f9", 
    borderRadius: 15,            
    padding: 15,                 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,               
  },
  filterOptionText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",              
  },
});
