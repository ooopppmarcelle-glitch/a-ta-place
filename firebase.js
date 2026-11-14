import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, orderBy, limit, onSnapshot, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging.js";

const config = window.ATP_FIREBASE_CONFIG || {};
const configured = config.apiKey && !config.apiKey.startsWith("YOUR_") && config.projectId && !config.projectId.startsWith("YOUR_");
let auth, db, messaging;
if (configured) {
  const app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  window.atpFirebaseReady = Promise.resolve(true);
} else {
  window.atpFirebaseReady = Promise.resolve(false);
}

const api = {
  configured,
  onAuth(callback) { if (auth) return onAuthStateChanged(auth, callback); callback(null); return () => {}; },
  async signUp({name, username, email, password}) {
    if (!configured) throw new Error("Firebase n'est pas encore configuré. Ajoute les clés dans firebase-config.js.");
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, {displayName:name});
    await setDoc(doc(db,"users",credential.user.uid), {
      displayName:name, username:username.toLowerCase(), email,
      photoURL:"", bio:"", language:"fr", createdAt:serverTimestamp()
    });
    return credential.user;
  },
  async signIn(email,password) {
    if (!configured) throw new Error("Firebase n'est pas encore configuré. Ajoute les clés dans firebase-config.js.");
    return (await signInWithEmailAndPassword(auth,email,password)).user;
  },
  async logout() { if (auth) await signOut(auth); },
  async enablePush() {
    if (!configured || !("Notification" in window) || !("serviceWorker" in navigator)) throw new Error("Les notifications push ne sont pas disponibles sur cet appareil ou Firebase n'est pas configuré.");
    if (!(await isSupported())) throw new Error("La messagerie push Firebase n'est pas prise en charge par ce navigateur.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Autorisation de notification refusée.");
    messaging = getMessaging();
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging,{vapidKey:window.ATP_FIREBASE_VAPID_KEY,serviceWorkerRegistration:registration});
    if (!token) throw new Error("Firebase n'a pas fourni de jeton push. Vérifie la clé VAPID.");
    await setDoc(doc(db,"users",auth.currentUser.uid),{fcmToken:token,pushEnabled:true},{merge:true});
    return true;
  },
  watchNotifications(callback,onError) {
    if (!db || !auth?.currentUser) { callback([]); return () => {}; }
    const q=query(collection(db,"users",auth.currentUser.uid,"notifications"),orderBy("createdAt","desc"),limit(50));
    return onSnapshot(q,snapshot=>callback(snapshot.docs.map(item=>({id:item.id,...item.data()}))),onError);
  },
  async markRead(id) {
    if (!db || !auth?.currentUser) return;
    await updateDoc(doc(db,"users",auth.currentUser.uid,"notifications",id),{read:true});
  },
  onForegroundMessage(callback) {
    if (!configured) return () => {};
    isSupported().then(ok=>{if(ok){messaging ||= getMessaging();onMessage(messaging,callback)}});
    return () => {};
  }
};
window.atpFirebase = api;
window.dispatchEvent(new Event('atpFirebaseReady'));
