importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");
const firebasePushConfig={
  apiKey:"YOUR_FIREBASE_API_KEY",
  authDomain:"YOUR_PROJECT_ID.firebaseapp.com",
  projectId:"YOUR_PROJECT_ID",
  storageBucket:"YOUR_PROJECT_ID.appspot.com",
  messagingSenderId:"YOUR_MESSAGING_SENDER_ID",
  appId:"YOUR_FIREBASE_APP_ID"
};
let pushMessaging=null;
if(firebasePushConfig.apiKey && !firebasePushConfig.apiKey.startsWith("YOUR_")){
  firebase.initializeApp(firebasePushConfig);
  pushMessaging=firebase.messaging();
  pushMessaging.onBackgroundMessage(payload=>{
    const title=payload.notification?.title||"À TA PLACE";
    self.registration.showNotification(title,{
      body:payload.notification?.body||"Tu as une nouvelle notification.",
      icon:"/icon.svg",badge:"/icon.svg",data:payload.data||{url:"/#notifications"}
    });
  });
}
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=event.notification.data?.url||"/#notifications";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    const existing=list.find(client=>client.url.startsWith(self.location.origin));
    if(existing){existing.navigate(target);return existing.focus();}
    return clients.openWindow(target);
  }));
});
const CACHE="a-ta-place-v2";
const CORE=["/","/index.html","/styles.css","/app.js","/firebase-config.js","/firebase.js","/manifest.webmanifest","/icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).origin!==location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match("/index.html")))});
