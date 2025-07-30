import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({

  background: {
    flex: 1,
    width: '100%',
    height: '100vh',
    alignItems: 'center',
  },
  
  lightBackground: {
    backgroundColor: '#064E41', // deep green
  },
  
  darkBackground: {
    backgroundColor: '#121212', // darker background for dark mode
  },  
  
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  darkContainer: {
    backgroundColor: '#121212', // consistent dark background
  },
  lightContainer: {
    backgroundColor: '#f5f5f5', // lighter background for better contrast
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 80, // slightly taller
    width: '100%',
    position: 'absolute',
    zIndex: 1,
    top: 0,
    paddingTop: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  lightTitleBar: {
    backgroundColor: 'rgba(6,78,65,1)',
    shadowColor: '#000',
  },
  darkTitleBar: {
    backgroundColor: '#1E3A34', // darker green for dark mode
    shadowColor: '#000',
  },
  logoStyle: {
    width: '7vw',
    height: '7vh',
    marginRight: 10,
  },
  titleText: {
    fontSize: 42,
    fontWeight: "bold",
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mainContent: {
    flexDirection: 'row',
    marginTop: 80, // adjusted to match titleBar height
    height: 'calc(100% - 80px)', // adjusted for title bar
  },
  topNav: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 30,
    paddingHorizontal: 20,
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lightTopNav: {
    backgroundColor: '#064E41', // green sidebar background for light mode
    borderRightColor: '#3D8C45',
    shadowColor: '#000',
  },
  darkTopNav: {
    backgroundColor: '#1E3A34', // darker green for dark mode
    borderRightColor: '#285F3B',
    shadowColor: '#000',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 10,
    width: '90%',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lightNavItem: {
    backgroundColor: 'white', // white buttons on green background
    borderColor: '#e0e0e0',
    shadowColor: '#000',
  },
  darkNavItem: {
    backgroundColor: '#2A2A2A', // dark buttons for dark mode
    borderColor: '#444',
    shadowColor: '#000',
  },
  navItemText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  lightNavItemText: {
    color: '#064E41', // green text for light mode
  },
  darkNavItemText: {
    color: '#7CC288', // light green text for dark mode
  },
  navDivider: {
    width: '90%',
    height: 1,
    marginVertical: 10,
    alignSelf: 'center',
    opacity: 0.4,
  },
  lightNavDivider: {
    backgroundColor: '#3D8C45', // green divider for light mode
  },
  darkNavDivider: {
    backgroundColor: '#285F3B', // darker green divider for dark mode
  },
  rightColumn: {
    flex: 1,
    marginLeft: 20,
    padding: 30,
    width: 'calc(100% - 280px)',
  },
  rightColumnHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: 'white',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  lightRightColumnHeader: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },
  darkRightColumnHeader: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
  },
  textInput: {
    width: '100%',
    maxWidth: 600,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lightTextInput: {
    borderColor: '#d0d0d0',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    shadowColor: '#000',
  },
  darkTextInput: {
    borderColor: '#444',
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    color: '#e0e0e0',
    shadowColor: '#000',
  },
  editButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  lightEditButton: {
    backgroundColor: '#057B34',
    shadowColor: '#000',
  },
  darkEditButton: {
    backgroundColor: '#0A9941',
    shadowColor: '#000',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  darkContent: {
    backgroundColor: '#2C2C2C',
  },
  lightContent: {
    backgroundColor: 'white',
  },
  darkText: {
    color: '#064E41', // green for light mode
  },
  lightText: {
    color: 'white', // white for dark mode
  },
  divider: {
    width: 2, // slightly thinner
    height: '100%',
    marginLeft: 280,
    position: 'absolute',
  },
  lightDivider: {
    backgroundColor: '#3D8C45', // green divider for light mode
  },
  darkDivider: {
    backgroundColor: '#285F3B', // darker green divider for dark mode
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  lightCancelButton: {
    backgroundColor: '#b00020',
    shadowColor: '#000',
  },
  darkCancelButton: {
    backgroundColor: '#CF0930',
    shadowColor: '#000',
  },
  // Profile section
  profileContainer: {
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 900,
    marginHorizontal: 'auto',
    marginBottom: 30,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    alignSelf: 'center',
  },
  lightProfileContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
  },
  darkProfileContainer: {
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    shadowColor: '#000',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  profileImageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 40,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  lightProfileImageContainer: {
    borderColor: '#3D8C45',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
  },
  darkProfileImageContainer: {
    borderColor: '#7CC288',
    backgroundColor: '#3A3A3A',
    shadowColor: '#000',
  },
  profileDetailsContainer: {
    flex: 1,
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileUsername: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 20,
  },
  lightProfileUsername: {
    color: '#064E41',
  },
  darkProfileUsername: {
    color: '#7CC288',
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  lightEditProfileButton: {
    backgroundColor: 'white',
    borderColor: '#057B34',
  },
  darkEditProfileButton: {
    backgroundColor: '#2A2A2A',
    borderColor: '#7CC288',
  },
  editProfileButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  lightEditProfileButtonText: {
    color: '#057B34',
  },
  darkEditProfileButtonText: {
    color: '#7CC288',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  statItem: {
    marginRight: 40,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  lightStatCount: {
    color: '#064E41',
  },
  darkStatCount: {
    color: '#7CC288',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  lightStatLabel: {
    color: '#555',
  },
  darkStatLabel: {
    color: '#BBB',
  },
  userInfoContainer: {
    marginBottom: 10,
  },
  userInfoItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  lightUserInfoItem: {
    color: '#333',
  },
  darkUserInfoItem: {
    color: '#DDD',
  },
  userInfoLabel: {
    fontWeight: 'bold',
  },
  lightUserInfoLabel: {
    color: '#064E41',
  },
  darkUserInfoLabel: {
    color: '#7CC288',
  },
  userBio: {
    fontSize: 15,
    marginTop: 5,
  },
  lightUserBio: {
    color: '#555',
  },
  darkUserBio: {
    color: '#BBB',
  },
  followModal: {
    padding: 25,
    borderRadius: 16,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  lightFollowModal: {
    backgroundColor: 'white',
    shadowColor: '#000',
  },
  darkFollowModal: {
    backgroundColor: '#2A2A2A',
    shadowColor: '#000',
  },
  followModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    borderBottomWidth: 2,
    paddingBottom: 10,
  },
  lightFollowModalTitle: {
    color: '#064E41',
    borderBottomColor: '#3D8C45',
  },
  darkFollowModalTitle: {
    color: '#7CC288',
    borderBottomColor: '#285F3B',
  },
  followUserItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  lightFollowUserItem: {
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
  },
  darkFollowUserItem: {
    backgroundColor: '#3A3A3A',
    shadowColor: '#000',
  },
  followUserName: {
    fontWeight: '600',
    fontSize: 16,
  },
  lightFollowUserName: {
    color: '#333',
  },
  darkFollowUserName: {
    color: '#DDD',
  },
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  lightFollowButton: {
    backgroundColor: '#057B34',
  },
  darkFollowButton: {
    backgroundColor: '#0A9941',
  },
  unfollowButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  lightUnfollowButton: {
    backgroundColor: '#b00020',
  },
  darkUnfollowButton: {
    backgroundColor: '#CF0930',
  },
  followButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 15,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  lightCloseButtonText: {
    color: '#b00020',
  },
  darkCloseButtonText: {
    color: '#FF3B5B',
  },
  // Empty state styles
  emptyStateContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100%',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default styles;
