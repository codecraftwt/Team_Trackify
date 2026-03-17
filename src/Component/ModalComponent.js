// import React from 'react';
// import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';


// const ModalComponent = ({
//   isVisible,
//   onClose,
//   title = "Modal Title",
//   content = "This is a common modal component.",
//   buttonText = "Close",
//   buttonBackgroundColor = "#C6303E",
//   onConfirm,
//   iconName, // NEW PROP
//   iconColor = '#C6303E', // optional styling
//   iconSize = wp('12%')
  
// }) => {
//   return (
//     <Modal
//       transparent
//       visible={isVisible}
//       animationType="slide"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
//             <Icon name="times" size={20} />
//           </TouchableOpacity>

//           {/* Icon above title */}
//           {iconName && (
//             <Icon name={iconName} size={iconSize} color={iconColor} style={styles.modalTopIcon} />
//           )}
//           <Text style={styles.modalTitle}>{title}</Text>
//           <View style={styles.contentContainer}>{content}</View>

//           <TouchableOpacity
//             style={[styles.submitButton, { backgroundColor: buttonBackgroundColor }]}
//             onPress={onConfirm}
//           >
//             <Text style={styles.buttonText}>{buttonText}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     width: wp('80%'),
//     backgroundColor: '#fff',
//     padding: wp('5%'),
//     borderRadius: wp('3%'),
//     alignItems: 'center',
//     position: 'relative',
//   },
//   closeIcon: {
//     position: 'absolute',
//     top: hp('1%'),
//     right: wp('3%'),
//     padding: wp('1.5%'),
//   },
//   modalTopIcon: {
//     marginBottom: hp('1.5%'),
//   },
//   modalTitle: {
//     fontSize: wp('5%'),
//     fontWeight: 'bold',
//     // marginBottom: hp('1.5%'),
//     textAlign: 'center',
//     color: '#212529',
//     marginTop: hp('2%'),

//   },
//   contentContainer: {
//     marginBottom: hp('3%'),
//     color: '#212529',

//   },
//   modalContentText: {
//     fontSize: wp('4%'),
//     textAlign: 'center',
//     color: '#333',
//   },
//   submitButton: {
//     paddingVertical: hp('1.5%'),
//     borderRadius: wp('2%'),
//     width: wp('60%'),
//     alignItems: 'center',
    

//   },
//   buttonText: {
//     fontSize: wp('4%'),
//     color: '#fff',
//     fontWeight: 'bold',
//   },
// });


// export default ModalComponent;
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const ModalComponent = ({
  isVisible,
  onClose,
  onConfirm,
  title = "Modal Title",
  // content = "This is a common modal component.",
  iconName,
  iconColor = '#C6303E',
  iconSize = wp('12%')
}) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Icon above title */}
          {iconName && (
            <Icon name={iconName} size={iconSize} color={iconColor} style={styles.modalTopIcon} />
          )}
          
          <Text style={styles.modalTitle}>{title}</Text>
          
          {/* <View style={styles.contentContainer}>
            <Text style={styles.modalContentText}>{content}</Text>
          </View> */}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.noButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.noButtonText]}>No</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.yesButton]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, styles.yesButtonText]}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: wp('80%'),
    backgroundColor: '#fff',
    padding: wp('5%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
  },
  modalTopIcon: {
    marginBottom: hp('1.5%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#212529',
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
  },
  contentContainer: {
    marginBottom: hp('3%'),
    paddingHorizontal: wp('2%'),
  },
  modalContentText: {
    fontSize: wp('4%'),
    textAlign: 'center',
    color: '#6c757d',
    lineHeight: hp('2.8%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: wp('2%'),
  },
  button: {
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    width: wp('30%'),
    alignItems: 'center',
    borderWidth: 1,
  },
  noButton: {
    backgroundColor: '#fff',
    borderColor: '#C6303E',
    marginRight: wp('2%'),
  },
  yesButton: {
    backgroundColor: '#C6303E',
    borderColor: '#C6303E',
    marginLeft: wp('2%'),
  },
  buttonText: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  noButtonText: {
    color: '#C6303E',
  },
  yesButtonText: {
    color: '#fff',
  },
});

export default ModalComponent;