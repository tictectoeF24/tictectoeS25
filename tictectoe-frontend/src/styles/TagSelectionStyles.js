import { StyleSheet } from "react-native";
 
export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 100,
  },
});