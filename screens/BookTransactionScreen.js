import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image } from 'react-native';
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import * as firebase from 'firebase'
import db from '../config'


export default class BookTransactionScreen extends React.Component{
    constructor(){
        super()
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            scannedBookId: '',
            scannedStudentID: '',
            buttonState: 'normal',
            transactionMessage : ''
        }
    }
    getCameraPermissions=async(ID)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions: status==="granted",
            buttonState: ID,
            scanned: false
        })
    }
    handleBarCodeScanned= async({type,data})=>{
        const {buttonState} = this.state.buttonState
        if(buttonState==="BookID"){
            this.setState({
                scanned: true,
                scannedBookID: data,
                buttonState: 'normal',
            })
        }else if(buttonState==="StudentID"){
            this.setState({
                scanned: true,
                scannedStudentID: data,
                buttonState: 'normal',
            })
        }
       
    }
    handleTransaction= async ()=>{
        //b.collection(collectionName).doc(documentID).get().then()
        var transactionMessage
        db.collection("Books").doc(this.state.scannedBookID).get().then((doc)=>{
            var book = doc.data();
            if(book.bookAvailibility){
                this.initiateBookIssue()
                transactionMessage = "Book Issued"
            }else {
                this.initiateBookReturn()
                transactionMessage = "Book Returned"
            }
        })
        this.setState({
            transactionMessage: transactionMessage,
        })
    }

    initiateBookIssue= async ()=>{
        db.collection("Transactions").add({
            studentID: this.state.scannedStudentID,
            bookID: this.state.scannedBookId,
            date: firebase.firestore.Timestamp.now().toDate(),
            transactionType: "Issue"
    })
    db.collection("Books").doc(this.state.scannedBookID).update({
        bookAvailibility: false,
    })
    db.collection("Students").doc(this.state.scannedStudentID).update({
        numberOfBooksIssued: firebase.firestore.FieldValue.increment(1)
    })
    Alert.alert("Book Issued")
    this.setState({
        scannedBookID: '',
        scannedStudentID: '',
    })
}

initiateBookReturn= async ()=>{
    db.collection("Transactions").add({
        studentID: this.state.scannedStudentID,
        bookID: this.state.scannedBookId,
        date: firebase.firestore.Timestamp.now().toDate(),
        transactionType: "Return"
})
db.collection("Books").doc(this.state.scannedBookID).update({
    bookAvailibility: true,
})
db.collection("Students").doc(this.state.scannedStudentID).update({
    numberOfBooksIssued: firebase.firestore.FieldValue.increment(-1)
})
Alert.alert("Book Returned")
this.setState({
    scannedBookID: '',
    scannedStudentID: '',
})
}
    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState = this.state.buttonState;
        if(buttonState!=='normal ' && hasCameraPermissions){
           return(
               <BarCodeScanner
               onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned}
               style={StyleSheet.absoluteFillObject}
               />
           )
        }else if(buttonState==='normal'){
            return(
                <View style = {{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <View>
                        <Image
                        style={{width: 200, height: 200}}
                        source={require("../assets/booklogo.jpg")}
                        />
                        <Text style={{textAlign: 'center', fontSize: 40}}> 
                            WILY
                        </Text>
                    </View>
                    <View style={styles.inputView}>
                    <TextInput
                    style = {styles.inputBox}
                    placeholder = "Enter Book ID"
                    value = {this.state.scannedBookID}
                    />
                    <TouchableOpacity style={styles.scanButton}
                     onPress = {()=>{this.getCameraPermissions("BookID")}}
                    >
                      <Text style={styles.displayText}>
                          Scan
                      </Text>
                    </TouchableOpacity>
                    </View>

                    <View style={styles.inputView}> 
                    <TextInput
                    style = {styles.inputBox}
                    placeholder = "Enter Student ID"
                    value = {this.state.scannedStudentID}
                    />
                    <TouchableOpacity style={styles.scanButton}
                     onPress = {()=>{this.getCameraPermissions("StudentID")}}
                    >
                    
                      <Text style={styles.displayText}>
                          Scan
                      </Text>
                    </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.scanning}
                     onPress={async()=>{
                       this.handleTransaction()
                     }}
                    >
                        <Text style={styles.displayText}>
                            Submit
                        </Text>
                    </TouchableOpacity>
                    
                </View>
            )
        }
        
    }
}
const styles = StyleSheet.create({
    scanning: {
        width: 200,
        height: 50,
        margin: 10,
        borderRadius: 15,
        backgroundColor: 'gold',
        alignItems: 'center',
        justifyContent: 'center'
    },
    displayText: {
        fontSize: 20,
        color: 'white',
        textAlign: 'center'
    },
    inputView: {
        flexDirection: "row",
        margin: 20,
    },
    inputBox: {
       width: 200,
       height: 40,
       borderWidth: 1.5,
       fontSize: 20
    },
    scanButton: {
       backgroundColor: 'blue',
       width: 50,
       borderWidth: 1.5
    }
})