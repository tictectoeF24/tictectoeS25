import { StyleSheet } from "react-native";

export const lightStyles = StyleSheet.create({
  background: {
    flex: 1,
  },
  wrapper: {
    flexDirection: "row",
    flex: 1,
  },
  sidebar: {
    width: "20%",
    backgroundColor: "#064E41",
    padding: 10,
  },
  sidebarItem: {
    color: "#ffffff",
    paddingVertical: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 16,
    color: "#000000",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 10,
  },
  author: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  category: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  date: {
    fontSize: 16,
    color: "#000000",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#57B360",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#ffffff",
    marginLeft: 5,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    backgroundColor: "#057B34",
    padding: 10,
    borderRadius: 5,
  },
  tabButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#ffffff",
  },
  tabText: {
    color: "#ffffff",
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: "bold",
    color: "#ffffff",
  },
  sectionContent: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 15,
  },
  commentsContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "70%",
    backgroundColor: "#2A2A2A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  commentsContent: {
    flex: 1,
  },
  commentItemContainer: {
    width: '100%',
    marginBottom: 10,
  },
  myCommentContainer: {
    alignItems: 'flex-end',
  },
  otherCommentContainer: {
    alignItems: 'flex-start',
  },
  commentItem: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
  },
  myCommentItem: {
    backgroundColor: "#4CAF50",
  },
  otherCommentItem: {
    backgroundColor: "#FFFFFF",
  },
  commentAuthor: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  myCommentAuthor: {
    color: "#FFFFFF",
  },
  otherCommentAuthor: {
    color: "#333",
  },
  commentText: {
    marginBottom: 5,
  },
  myCommentText: {
    color: "#FFFFFF",
  },
  otherCommentText: {
    color: "#333",
  },
  newCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 5,
    backgroundColor: "#FFF",
    marginRight: 10,
  },
  addCommentButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#57B360",
    borderRadius: 5,
  },
  addCommentButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export const darkStyles = StyleSheet.create({
  background: {
    flex: 1,
  },
  wrapper: {
    flexDirection: "row",
    flex: 1,
  },
  sidebar: {
    width: "20%",
    backgroundColor: "#1A1A1A",
    padding: 10,
  },
  sidebarItem: {
    color: "#E0E0E0",
    paddingVertical: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: "#333333",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
  },
  author: {
    fontSize: 18,
    color: "#AAAAAA",
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  category: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  date: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#4E9A51",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#000000",
    marginLeft: 5,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    backgroundColor: "#2A5934",
    padding: 10,
    borderRadius: 5,
  },
  tabButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  tabText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  sectionContent: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 15,
  },
  commentsContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "70%",
    backgroundColor: "#333333",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  commentsContent: {
    flex: 1,
  },
  commentItemContainer: {
    width: '100%',
    marginBottom: 10,
  },
  myCommentContainer: {
    alignItems: 'flex-end',
  },
  otherCommentContainer: {
    alignItems: 'flex-start',
  },
  commentItem: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
  },
  myCommentItem: {
    backgroundColor: "#4CAF50",
  },
  otherCommentItem: {
    backgroundColor: "#444444",
  },
  commentAuthor: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  myCommentAuthor: {
    color: "#FFFFFF",
  },
  otherCommentAuthor: {
    color: "#FFFFFF",
  },
  commentText: {
    marginBottom: 5,
  },
  myCommentText: {
    color: "#FFFFFF",
  },
  otherCommentText: {
    color: "#FFFFFF",
  },
  newCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 5,
    backgroundColor: "#FFF",
    marginRight: 10,
  },
  addCommentButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#57B360",
    borderRadius: 5,
  },
  addCommentButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
