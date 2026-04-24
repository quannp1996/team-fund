import { ref } from 'vue'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

export function useFirebase() {
  const user = ref(null)
  const firestore = firebase.firestore()

  firebase.auth().onAuthStateChanged((currentUser) => {
    user.value = currentUser
  })

  return {
    user,
    firestore
  }
}