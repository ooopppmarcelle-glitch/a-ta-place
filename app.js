const seedStories=[
{id:"s1",name:"Mina",initial:"M",time:"Il y a 12 min",category:"AMITIÉ",text:"Ma meilleure amie raconte mes secrets à son copain. Je viens de le découvrir. Vous feriez quoi ?",choices:["Je lui parle franchement","Je prends mes distances","Je lui laisse une dernière chance"],votes:[42,31,18],mine:null},
{id:"s2",name:"Joël",initial:"J",time:"Il y a 38 min",category:"QUOTIDIEN",text:"Un ami me demande de couvrir son retard au travail alors qu'il recommence chaque semaine. Je fais quoi ?",choices:["Je le couvre encore","Je refuse cette fois","Je lui conseille d'assumer"],votes:[12,56,37],mine:null},
{id:"s3",name:"Anonyme",initial:"A",time:"Il y a 1 h",category:"FAMILLE",text:"On m'invite à une sortie, mais j'avais promis de passer la journée avec ma famille. Quel choix ferait le plus de sens ?",choices:["Je garde ma promesse","Je propose un autre jour","Je partage mon temps"],votes:[29,15,48],mine:null}
];
const KEY="atp-v1-stories";
let stories=JSON.parse(localStorage.getItem(KEY)||"null")||seedStories;
let filter="all";let deferredInstall=null;
const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(KEY,JSON.stringify(stories));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(){let list=[...stories];if(filter==="popular")list.sort((a,b)=>b.votes.reduce((x,y)=>x+y,0)-a.votes.reduce((x,y)=>x+y,0));if(filter==="new")list.reverse();$("#feedCount").textContent=list.length+" sujets";$("#feed").innerHTML=list.length?list.map(story=>{const total=story.votes.reduce((a,b)=>a+b,0);return `<article class="story-card"><div class="story-meta"><div class="author"><span class="author-avatar">${escapeHTML(story.initial)}</span>${escapeHTML(story.name)}</div><span class="story-time">${escapeHTML(story.time)}</span></div><span class="category">${escapeHTML(story.category)}</span><p class="story-text">${escapeHTML(story.text)}</p><p class="vote-label">${story.mine===null?"TU FERAIS QUOI ?":"RÉSULTATS DE LA COMMUNAUTÉ"}</p><div class="choices">${story.choices.map((choice,i)=>{const pct=total?Math.round(story.votes[i]/total*100):0;return `<button class="choice ${story.mine===i?"chosen":""}" data-story="${story.id}" data-choice="${i}" ${story.mine!==null?"disabled":""}><span class="choice-fill" style="width:${story.mine!==null?pct:0}%"></span><span class="choice-label">${escapeHTML(choice)}</span><span class="choice-percent">${story.mine!==null?pct+"%":"›"}</span></button>`}).join("")}</div><div class="story-footer"><span>◉ ${total} votes</span><button class="share-btn" data-share="${story.id}">Partager ↗</button></div></article>`}).join(""):'<div class="empty-state">Aucune situation pour le moment. Lance le débat !</div>'}
function show(title,text){$("#dialogTitle").textContent=title;$("#dialogText").textContent=text;$("#messageDialog").showModal()}
$("#storyInput").addEventListener("input",e=>$("#charCount").textContent=e.target.value.length+"/240");
$("#publishBtn").addEventListener("click",()=>{const text=$("#storyInput").value.trim();if(text.length<12){show("Raconte un peu plus","Ajoute quelques détails pour aider la communauté à comprendre ta situation (12 caractères minimum).");return}const id=crypto.randomUUID?crypto.randomUUID():String(Date.now());stories.unshift({id,name:"Toi",initial:"T",time:"À l'instant",category:"NOUVEAU DÉBAT",text,choices:["J'en parle directement","Je prends du recul","Je laisse passer"],votes:[0,0,0],mine:null});save();$("#storyInput").value="";$("#charCount").textContent="0/240";filter="all";document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.filter==="all"));render();show("C'est publié !","Ta situation est maintenant dans le fil. Invite tes proches à donner leur avis.");window.scrollTo({top:500,behavior:"smooth"})});
$("#feed").addEventListener("click",e=>{const vote=e.target.closest("[data-choice]");if(vote){const story=stories.find(s=>s.id===vote.dataset.story);if(!story||story.mine!==null)return;const choice=Number(vote.dataset.choice);story.votes[choice]++;story.mine=choice;save();render();return}const share=e.target.closest("[data-share]");if(share){const s=stories.find(x=>x.id===share.dataset.share);const text="Tu ferais quoi à ma place ? "+s.text+" — Donne ton avis sur À TA PLACE.";if(navigator.share)navigator.share({title:"À TA PLACE",text,url:location.href}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(text+" "+location.href).then(()=>show("Lien copié","Partage ce débat avec tes amis."));else show("À partager",text)}});
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{filter=t.dataset.filter;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===t));render()}));
$("#createNav").addEventListener("click",()=>{$("#storyInput").focus();window.scrollTo({top:250,behavior:"smooth"})});
$("#closeDialog").addEventListener("click",()=>$("#messageDialog").close());$("#dialogOk").addEventListener("click",()=>$("#messageDialog").close());
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").hidden=false});
$("#installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installBtn").hidden=true});
render();

/* --- Comptes Firebase et centre de notifications --- */
let signedInUser=null;
let stopNotifications=null;
let currentNotifications=[];
const accountDialog=$("#accountDialog");
const notificationPage=$("#notificationsPage");
function openAccount(mode="signup"){
  accountDialog.showModal();
  setAccountMode(mode);
}
function setAccountMode(mode){
  const signup=mode==="signup";
  $("#signupForm").hidden=!signup;
  $("#loginForm").hidden=signup;
  $("#showSignup").classList.toggle("active",signup);
  $("#showLogin").classList.toggle("active",!signup);
  $("#accountTitle").textContent=signup?"Crée ton espace":"Content de te revoir";
  $("#accountFeedback").textContent="";
}
function accountMessage(message,isError=false){
  const node=$("#accountFeedback");node.textContent=message;node.classList.toggle("error",isError);
}
function showNotifications(){
  document.querySelector(".welcome").hidden=true;
  document.querySelector(".composer-card").hidden=true;
  document.querySelector(".feed-tabs").hidden=true;
  document.querySelector(".feed-heading").hidden=true;
  $("#feed").hidden=true;
  document.querySelector(".bottom-note").hidden=true;
  notificationPage.hidden=false;
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("selected"));
  $("#activityNav").classList.add("selected");
  window.scrollTo({top:0,behavior:"smooth"});
}
function showFeed(){
  notificationPage.hidden=true;
  document.querySelector(".welcome").hidden=false;
  document.querySelector(".composer-card").hidden=false;
  document.querySelector(".feed-tabs").hidden=false;
  document.querySelector(".feed-heading").hidden=false;
  $("#feed").hidden=false;
  document.querySelector(".bottom-note").hidden=false;
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("selected"));
  document.querySelector('.nav-item[href="#"]')?.classList.add("selected");
}
function renderNotifications(items){
  currentNotifications=items;
  const unread=items.filter(n=>!n.read).length;
  $("#notificationBadge").hidden=!unread;
  $("#notificationBadge").textContent=unread>9?"9+":String(unread);
  $("#notificationSummary").textContent=unread?unread+" nouvelle(s) notification(s)":items.length+" notification(s)";
  if(!items.length){
    $("#notificationList").innerHTML='<div class="notification-empty"><span class="notification-empty-icon">✦</span><h3>Tout est calme ici</h3><p>Les réactions à tes situations et les nouvelles réponses apparaîtront ici.</p></div>';
    return;
  }
  $("#notificationList").innerHTML=items.map(n=>`<article class="notification-item ${n.read?"":"unread"}"><span class="notification-symbol">${n.type==="comment"?"↳":n.type==="vote"?"✓":n.type==="reveal"?"✦":"●"}</span><div><h3>${escapeHTML(n.title||"Nouvelle activité")}</h3><p>${escapeHTML(n.body||"Une personne a interagi avec ta situation.")}</p><time>${n.createdAt?.toDate?n.createdAt.toDate().toLocaleString("fr-FR"):"Récemment"}</time></div><span class="unread-dot"></span></article>`).join("");
}
$("#notificationsBtn").addEventListener("click",showNotifications);
$("#activityNav").addEventListener("click",showNotifications);
$("#backToFeed").addEventListener("click",showFeed);
$("#closeAccount").addEventListener("click",()=>accountDialog.close());
$("#showSignup").addEventListener("click",()=>setAccountMode("signup"));
$("#showLogin").addEventListener("click",()=>setAccountMode("login"));
$("#profileBtn").addEventListener("click",()=>openAccount(signedInUser?"login":"signup"));
$("#profileNav").addEventListener("click",()=>openAccount(signedInUser?"login":"signup"));
$("#signupForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  const name=String(f.get("name")).trim(),username=String(f.get("username")).trim(),email=String(f.get("email")).trim(),password=String(f.get("password"));
  try{
    const fb=window.atpFirebase;if(!fb?.configured)throw new Error("Firebase doit d'abord être configuré dans firebase-config.js.");
    accountMessage("Création de ton compte…");
    await fb.signUp({name,username,email,password});
    accountDialog.close();show("Bienvenue sur À TA PLACE","Ton compte est créé. Tu peux maintenant retrouver ton profil sur tes appareils.");
  }catch(err){accountMessage(err.message||"Impossible de créer le compte.",true)}
});
$("#loginForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  try{accountMessage("Connexion…");await window.atpFirebase.signIn(String(f.get("email")).trim(),String(f.get("password")));accountDialog.close();show("Connexion réussie","Tu es connecté à ton espace À TA PLACE.");}
  catch(err){accountMessage(err.message||"Connexion impossible.",true)}
});
$("#enablePushBtn").addEventListener("click",async()=>{
  try{await window.atpFirebase.enablePush();show("Notifications activées","Tu pourras recevoir les alertes de À TA PLACE lorsque l'application est installée ou autorisée par ton navigateur.");}
  catch(err){show("Activation impossible",err.message||"Vérifie la configuration Firebase et les autorisations du navigateur.");}
});
$("#markAllRead").addEventListener("click",async()=>{
  if(!window.atpFirebase)return;
  await Promise.all(currentNotifications.filter(n=>!n.read).map(n=>window.atpFirebase.markRead(n.id)));
});
function connectFirebaseAccount(){
  const fb=window.atpFirebase;
  if(!fb?.configured)return;
  fb.onAuth(user=>{
    signedInUser=user;
    $("#profileBtn").textContent=user?(user.displayName||"A").slice(0,1).toUpperCase():"?";
    if(stopNotifications){stopNotifications();stopNotifications=null;}
    if(user){
      stopNotifications=fb.watchNotifications(renderNotifications,err=>console.warn("Notifications:",err));
      fb.onForegroundMessage(payload=>{
        const note=payload.notification||{};
        renderNotifications([{id:"foreground-"+Date.now(),title:note.title||"À TA PLACE",body:note.body||"Nouvelle activité",type:"activity",read:false},...currentNotifications]);
      });
    }else renderNotifications([]);
  });
}
window.addEventListener("atpFirebaseReady",connectFirebaseAccount);
if(window.atpFirebase) connectFirebaseAccount();
