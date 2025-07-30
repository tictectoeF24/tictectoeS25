import { StyleSheet } from "react-native";

const baseStyles = {
  container: {
    flex: 1,
    width: '100%',
    height: '100vh',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100vh',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '100%',
    padding: 0,
    paddingHorizontal: '1rem',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    minHeight: '4rem',
    position: 'relative',
    paddingHorizontal: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  navbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  navbarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    flex: 3,
    flexWrap: 'wrap',
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1.5rem',
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    minWidth: '200px',
    height: '3rem',
    paddingHorizontal: '1rem',
    borderRadius: '1.5rem',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: '0.75rem',
    fontSize: '1rem',
    backgroundColor: 'transparent',
  },
  smallDatePicker: {
    height: '3rem',
    flex: 1,
    minWidth: '100px',
    maxWidth: '180px',
    borderRadius: '1.5rem',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    height: '3rem',
    minWidth: '80px',
    maxWidth: '120px',
    borderRadius: '1.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.5,
  },
  paperList: {
    width: '100%',
    flex: 1,
    overflowY: 'auto',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    scrollSnapType: 'y mandatory',
    display: 'flex',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  paperContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    scrollSnapAlign: 'start',
    padding: 0,
    display: 'flex',
  },
  paperCard: {
    aspectRatio: '1/1',
    width: '90%',
    maxWidth: 'min(800px, 75vh)',
    maxHeight: 'min(800px, 80vh)',
    backgroundColor: '#ffffff',
    borderRadius: '1.5rem',
    padding: '1.25rem',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    margin: 'auto',
    overflow: 'hidden',
    transform: 'translateY(-3vh)',
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  titleSection: {
    marginBottom: '0.5rem',
    overflow: 'hidden',
    flexShrink: 0,
  },
  metadataSection: {
    marginBottom: '0.5rem',
    overflow: 'hidden',
    flexShrink: 0,
  },
  abstractSection: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
  },
  abstractText: {
    color: '#333333',
    lineHeight: '1.75rem',
    fontSize: '1.1rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 1000,
    WebkitBoxOrient: 'vertical',
    height: '100%',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: '0.5rem',
    borderTopWidth: 1,
    flexShrink: 0,
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  navbarText: {
    fontSize: '1rem',
    color: '#fff',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dateText: {
    fontSize: '1rem',
    color: '#fff',
    fontWeight: '500',
  },
  applyButtonText: {
    fontSize: '1rem',
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    display: 'flex',
  },
  modalContent: {
    padding: '1.5rem',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  modalText: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: '0.75rem',
    marginBottom: '1rem',
    width: '100%',
  },
  modalButton: {
    padding: '0.75rem',
    borderRadius: 6,
    flex: 1,
    minWidth: '120px',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: '600',
  },
  modalCancelButton: {
    padding: '0.5rem',
  },
  modalCancelText: {
    fontSize: '0.875rem',
  },
  '@media (max-width: 1200px)': {
    navbar: {
      paddingHorizontal: '0.5rem',
    },
    paperCard: {
      width: '95%',
      padding: '1.25rem',
      maxHeight: 'min(700px, 75vh)',
    },
    abstractText: {
      fontSize: '1.05rem',
      lineHeight: '1.65rem',
    },
  },
  '@media (max-width: 1024px)': {
    navbar: {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '0.5rem',
      marginBottom: 0,
    },
    navbarLeft: {
      justifyContent: 'center',
    },
    navbarCenter: {
      marginTop: '0.25rem',
      marginBottom: '0.25rem',
      width: '100%',
      flex: 'initial',
    },
    navbarRight: {
      justifyContent: 'center',
      flex: 'initial',
    },
    paperList: {
      flex: 1,
    },
    paperContainer: {
      height: '100%',
    },
    paperCard: {
      maxWidth: 'min(700px, 70vh)',
      maxHeight: 'min(700px, 70vh)',
    },
    abstractText: {
      fontSize: '1rem',
      lineHeight: '1.6rem',
    },
  },
  '@media (max-width: 768px)': {
    navbarCenter: {
      flexDirection: 'column',
      width: '100%',
      gap: '0.5rem',
    },
    navbarText: {
      fontSize: '0.9rem',
    },
    searchBar: {
      width: '100%',
      maxWidth: 'none',
    },
    smallDatePicker: {
      width: '100%',
      maxWidth: 'none',
    },
    applyButton: {
      width: '100%',
      maxWidth: 'none',
    },
    paperCard: {
      padding: '1rem',
      width: '95%',
      maxWidth: 'min(600px, 85vw)',
      maxHeight: 'min(600px, 85vw)',
    },
    modalButtonContainer: {
      flexDirection: 'column',
    },
    modalButton: {
      width: '100%',
      marginBottom: '0.5rem',
    },
    abstractText: {
      fontSize: '0.95rem',
      lineHeight: '1.5rem',
    },
    titleSection: {
      marginBottom: '0.6rem',
    },
    metadataSection: {
      marginBottom: '0.6rem',
    },
    iconRow: {
      marginTop: '0.6rem',
      paddingTop: '0.6rem',
    },
  },
  '@media (max-width: 480px)': {
    navbarLeft: {
      gap: '0.5rem',
    },
    navbarText: {
      fontSize: '0.8rem',
      maxWidth: '80px',
    },
    paperCard: {
      width: '98%',
      padding: '0.75rem',
      borderRadius: '1rem',
    },
    titleSection: {
      marginBottom: '0.5rem',
    },
    metadataSection: {
      marginBottom: '0.5rem',
    },
    iconRow: {
      paddingTop: '0.5rem',
      marginTop: '0.5rem',
    },
    abstractText: {
      fontSize: '0.9rem',
      lineHeight: '1.4rem',
    },
  },
};

export const lightStyles = StyleSheet.create({
  ...baseStyles,
  background: {
    ...baseStyles.background,
    backgroundColor: '#064E41',
  },
  searchBar: {
    ...baseStyles.searchBar,
    backgroundColor: '#fff',
  },
  searchInput: {
    ...baseStyles.searchInput,
    color: '#333',
  },
  smallDatePicker: {
    ...baseStyles.smallDatePicker,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  applyButton: {
    ...baseStyles.applyButton,
    backgroundColor: '#00A54B',
  },
  paperCard: {
    ...baseStyles.paperCard,
    backgroundColor: '#fff',
  },
  abstractText: {
    ...baseStyles.abstractText,
    color: '#333333',
  },
  iconRow: {
    ...baseStyles.iconRow,
    borderColor: '#e0e0e0',
  },
  modalContent: {
    ...baseStyles.modalContent,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    ...baseStyles.modalTitle,
    color: '#333333',
  },
  modalText: {
    ...baseStyles.modalText,
    color: '#666666',
  },
  modalCancelText: {
    ...baseStyles.modalCancelText,
    color: '#666666',
  },
});

export const darkStyles = StyleSheet.create({
  ...baseStyles,
  background: {
    ...baseStyles.background,
    backgroundColor: '#1A1A1A',
  },
  searchBar: {
    ...baseStyles.searchBar,
    backgroundColor: '#333',
  },
  searchInput: {
    ...baseStyles.searchInput,
    color: '#fff',
  },
  smallDatePicker: {
    ...baseStyles.smallDatePicker,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  applyButton: {
    ...baseStyles.applyButton,
    backgroundColor: '#017D3A',
  },
  paperCard: {
    ...baseStyles.paperCard,
    backgroundColor: '#333',
  },
  abstractText: {
    ...baseStyles.abstractText,
    color: '#E0E0E0',
  },
  iconRow: {
    ...baseStyles.iconRow,
    borderColor: '#555',
  },
  modalContent: {
    ...baseStyles.modalContent,
    backgroundColor: '#1a1a1a',
  },
  modalTitle: {
    ...baseStyles.modalTitle,
    color: '#ffffff',
  },
  modalText: {
    ...baseStyles.modalText,
    color: '#cccccc',
  },
  modalCancelText: {
    ...baseStyles.modalCancelText,
    color: '#cccccc',
  },
});
