// Service worker Firebase Cloud Messaging.
// Copie les mêmes valeurs que dans firebase-config.js avant d'activer les notifications.
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || "À TA PLACE";
  const options = {
    body: payload.notification?.body || "Tu as une nouvelle notification.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: payload.data || {url:"/#notifications"}
  };
  self.registration.showNotification(title,options);
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=event.notification.data?.url || "/#notifications";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    const existing=list.find(client=>client.url.includes(self.location.origin));
    if(existing){existing.navigate(target);return existing.focus();}
    return clients.openWindow(target);
  }));
});
