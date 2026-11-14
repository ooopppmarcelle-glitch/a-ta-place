import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const config = window.ATP_SUPABASE_CONFIG || {};
const supabase = createClient(config.url, config.publishableKey);
window.atpSupabase = supabase;

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

let session = null;
let currentUser = null;
let stories = [];
let filter = "all";
let currentNotifications = [];

const accountDialog = $("#accountDialog");
const notificationPage = $("#notificationsPage");

function show(title, text) {
  $("#dialogTitle").textContent = title;
  $("#dialogText").textContent = text;
  $("#messageDialog").showModal();
}
function accountMessage(message, isError = false) {
  const node = $("#accountFeedback");
  node.textContent = message;
  node.classList.toggle("error", isError);
}
function setAccountMode(mode = "signup") {
  const signup = mode === "signup";
  $("#signupForm").hidden = !signup;
  $("#loginForm").hidden = signup;
  $("#showSignup").classList.toggle("active", signup);
  $("#showLogin").classList.toggle("active", !signup);
  $("#accountTitle").textContent = signup ? "Crée ton espace" : "Content de te revoir";
  accountMessage("");
}
function openAccount(mode = "signup") {
  setAccountMode(mode);
  accountDialog.showModal();
}
function showNotifications() {
  for (const selector of [".welcome", ".composer-card", ".feed-tabs", ".feed-heading", "#feed", ".bottom-note"]) {
    $(selector).hidden = true;
  }
  notificationPage.hidden = false;
  document.querySelectorAll(".nav-item").forEach((node) => node.classList.remove("selected"));
  $("#activityNav").classList.add("selected");
  loadNotifications();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showFeed() {
  notificationPage.hidden = true;
  for (const selector of [".welcome", ".composer-card", ".feed-tabs", ".feed-heading", "#feed", ".bottom-note"]) {
    $(selector).hidden = false;
  }
  document.querySelectorAll(".nav-item").forEach((node) => node.classList.remove("selected"));
  document.querySelector('.nav-item[href="#"]')?.classList.add("selected");
}
function timeAgo(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return new Date(value).toLocaleDateString("fr-FR");
}

async function loadFeed() {
  $("#feed").innerHTML = '<div class="empty-state">Chargement des situations…</div>';
  let query = supabase.from("stories").select("id,body,author_id,status,created_at");
  query = currentUser
    ? query.or(`status.eq.published,author_id.eq.${currentUser.id}`)
    : query.eq("status", "published");
  const { data: storyRows, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) {
    $("#feed").innerHTML = '<div class="empty-state">Impossible de charger le fil. Réessaie dans un instant.</div>';
    console.error("Feed:", error);
    return;
  }
  const ids = (storyRows || []).map((story) => story.id);
  if (!ids.length) {
    stories = [];
    renderFeed();
    return;
  }
  const [profilesResult, choicesResult, totalsResult, myVotesResult] = await Promise.all([
    supabase.from("profiles").select("id,display_name,username").in("id", [...new Set(storyRows.map((s) => s.author_id))]),
    supabase.from("story_choices").select("id,story_id,label,position").in("story_id", ids).order("position"),
    supabase.from("story_vote_totals").select("story_id,choice_id,vote_count").in("story_id", ids),
    currentUser
      ? supabase.from("votes").select("story_id,choice_id").eq("user_id", currentUser.id).in("story_id", ids)
      : Promise.resolve({ data: [], error: null })
  ]);
  if (profilesResult.error || choicesResult.error || totalsResult.error || myVotesResult.error) {
    console.error("Feed relations:", profilesResult.error || choicesResult.error || totalsResult.error || myVotesResult.error);
  }
  const profiles = new Map((profilesResult.data || []).map((p) => [p.id, p]));
  const choicesByStory = new Map();
  for (const choice of choicesResult.data || []) {
    if (!choicesByStory.has(choice.story_id)) choicesByStory.set(choice.story_id, []);
    choicesByStory.get(choice.story_id).push(choice);
  }
  const totals = new Map((totalsResult.data || []).map((item) => [item.choice_id, Number(item.vote_count)]));
  const myVotes = new Map((myVotesResult.data || []).map((item) => [item.story_id, item.choice_id]));
  stories = storyRows.map((story) => {
    const profile = profiles.get(story.author_id);
    return {
      ...story,
      name: profile?.display_name || "Membre",
      username: profile?.username || "",
      choices: (choicesByStory.get(story.id) || []).map((choice) => ({
        ...choice, votes: totals.get(choice.id) || 0
      })),
      myVote: myVotes.get(story.id) || null
    };
  });
  renderFeed();
}

function renderFeed() {
  let list = [...stories];
  if (filter === "popular") list.sort((a, b) => b.choices.reduce((n, c) => n + c.votes, 0) - a.choices.reduce((n, c) => n + c.votes, 0));
  if (filter === "new") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  $("#feedCount").textContent = `${list.length} sujets`;
  $("#feed").innerHTML = list.length ? list.map((story) => {
    const total = story.choices.reduce((sum, choice) => sum + choice.votes, 0);
    const authorInitial = (story.name || "M").slice(0, 1).toUpperCase();
    const isPending = story.status !== "published";
    return `<article class="story-card">
      <div class="story-meta"><div class="author"><span class="author-avatar">${escapeHTML(authorInitial)}</span>${escapeHTML(story.name)}</div><span class="story-time">${escapeHTML(timeAgo(story.created_at))}</span></div>
      ${isPending ? '<span class="category">EN ATTENTE DE MODÉRATION</span>' : '<span class="category">SITUATION DE LA COMMUNAUTÉ</span>'}
      <p class="story-text">${escapeHTML(story.body)}</p>
      <p class="vote-label">${story.myVote ? "RÉSULTATS DE LA COMMUNAUTÉ" : "TU FERAIS QUOI ?"}</p>
      <div class="choices">${story.choices.map((choice) => {
        const pct = total ? Math.round(choice.votes / total * 100) : 0;
        const voted = story.myVote === choice.id;
        const canVote = story.status === "published" && !story.myVote;
        return `<button class="choice ${voted ? "chosen" : ""}" data-story="${story.id}" data-choice="${choice.id}" ${canVote ? "" : "disabled"}>
          <span class="choice-fill" style="width:${story.myVote ? pct : 0}%"></span>
          <span class="choice-label">${escapeHTML(choice.label)}</span>
          <span class="choice-percent">${story.myVote ? pct + "%" : "›"}</span>
        </button>`;
      }).join("")}</div>
      <div class="story-footer"><span>◉ ${total} votes</span><button class="share-btn" data-share="${story.id}">Partager ↗</button></div>
    </article>`;
  }).join("") : '<div class="empty-state">Aucune situation publiée pour le moment. Reviens bientôt !</div>';
}

async function publishStory() {
  if (!currentUser) return openAccount("signup");
  const body = $("#storyInput").value.trim();
  if (body.length < 12) return show("Raconte un peu plus", "Ajoute quelques détails pour aider la communauté à comprendre ta situation (12 caractères minimum).");
  const button = $("#publishBtn");
  button.disabled = true;
  button.textContent = "Envoi…";
  const { data: story, error } = await supabase.from("stories")
    .insert({ author_id: currentUser.id, body })
    .select("id").single();
  if (error) {
    show("Publication impossible", error.message.includes("row-level") ? "Connecte-toi pour publier ta situation." : "Réessaie dans un instant.");
    console.error(error);
  } else {
    const labels = ["J'en parle directement", "Je prends du recul", "Je laisse passer"];
    const { error: choicesError } = await supabase.from("story_choices").insert(
      labels.map((label, index) => ({ story_id: story.id, label, position: index + 1 }))
    );
    if (choicesError) {
      console.error(choicesError);
      show("Situation enregistrée", "La situation attend la modération. Les choix n'ont pas pu être ajoutés ; l'équipe technique doit vérifier.");
    } else {
      $("#storyInput").value = "";
      $("#charCount").textContent = "0/240";
      show("Situation envoyée", "Elle est enregistrée et attend une vérification avant d'apparaître publiquement.");
    }
    await loadFeed();
  }
  button.disabled = false;
  button.innerHTML = 'Demander l’avis <span>↗</span>';
}

async function vote(storyId, choiceId) {
  if (!currentUser) return openAccount("signup");
  const { error } = await supabase.from("votes").insert({
    story_id: storyId, choice_id: choiceId, user_id: currentUser.id
  });
  if (error) {
    show("Vote non enregistré", error.code === "23505" ? "Tu as déjà voté pour cette situation." : "Connecte-toi et réessaie.");
    return;
  }
  await loadFeed();
}
async function loadNotifications() {
  if (!currentUser) {
    $("#notificationList").innerHTML = '<div class="notification-empty"><h3>Connecte-toi pour voir tes notifications</h3><p>Ton espace personnel est réservé à ton compte.</p></div>';
    $("#notificationBadge").hidden = true;
    return;
  }
  const { data, error } = await supabase.from("notifications")
    .select("id,kind,title,body,read_at,created_at")
    .eq("recipient_id", currentUser.id).order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("Notifications:", error);
    $("#notificationList").innerHTML = '<div class="notification-empty"><h3>Notifications indisponibles</h3><p>Réessaie plus tard.</p></div>';
    return;
  }
  currentNotifications = data || [];
  const unread = currentNotifications.filter((n) => !n.read_at).length;
  $("#notificationBadge").hidden = !unread;
  $("#notificationBadge").textContent = unread > 9 ? "9+" : String(unread);
  $("#notificationSummary").textContent = unread ? `${unread} nouvelle(s) notification(s)` : `${currentNotifications.length} notification(s)`;
  $("#notificationList").innerHTML = currentNotifications.length ? currentNotifications.map((n) => `
    <article class="notification-item ${n.read_at ? "" : "unread"}">
      <span class="notification-symbol">${n.kind === "comment" ? "↳" : n.kind === "vote" ? "✓" : n.kind === "reveal" ? "✦" : "●"}</span>
      <div><h3>${escapeHTML(n.title)}</h3><p>${escapeHTML(n.body)}</p><time>${escapeHTML(timeAgo(n.created_at))}</time></div>
      ${n.read_at ? "" : '<span class="unread-dot"></span>'}
    </article>`).join("") : '<div class="notification-empty"><span class="notification-empty-icon">✦</span><h3>Tout est calme ici</h3><p>Les nouvelles de ta communauté apparaîtront ici.</p></div>';
}
async function markAllRead() {
  if (!currentUser) return;
  const unreadIds = currentNotifications.filter((n) => !n.read_at).map((n) => n.id);
  if (!unreadIds.length) return;
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
  if (error) console.error(error);
  await loadNotifications();
}

$("#storyInput").addEventListener("input", (event) => $("#charCount").textContent = event.target.value.length + "/240");
$("#publishBtn").addEventListener("click", publishStory);
$("#feed").addEventListener("click", (event) => {
  const choice = event.target.closest("[data-choice]");
  if (choice) return vote(choice.dataset.story, choice.dataset.choice);
  const share = event.target.closest("[data-share]");
  if (share) {
    const story = stories.find((item) => item.id === share.dataset.share);
    if (!story) return;
    const text = `Tu ferais quoi à ma place ? ${story.body} — Donne ton avis sur À TA PLACE.`;
    if (navigator.share) navigator.share({ title: "À TA PLACE", text, url: location.href }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + " " + location.href).then(() => show("Lien copié", "Partage ce débat avec tes amis."));
  }
});
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  filter = tab.dataset.filter;
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
  renderFeed();
}));
$("#createNav").addEventListener("click", () => { $("#storyInput").focus(); window.scrollTo({ top: 250, behavior: "smooth" }); });
$("#notificationsBtn").addEventListener("click", showNotifications);
$("#activityNav").addEventListener("click", showNotifications);
$("#backToFeed").addEventListener("click", showFeed);
$("#closeDialog").addEventListener("click", () => $("#messageDialog").close());
$("#dialogOk").addEventListener("click", () => $("#messageDialog").close());
$("#closeAccount").addEventListener("click", () => accountDialog.close());
$("#showSignup").addEventListener("click", () => setAccountMode("signup"));
$("#showLogin").addEventListener("click", () => setAccountMode("login"));
$("#profileBtn").addEventListener("click", () => currentUser ? show("Ton compte", "Tu es connecté. Utilise Profil en bas pour te déconnecter.") : openAccount("signup"));
$("#profileNav").addEventListener("click", () => currentUser
  ? supabase.auth.signOut().then(() => show("Déconnexion", "Tu es déconnecté de ton compte."))
  : openAccount("signup"));
$("#markAllRead").addEventListener("click", markAllRead);
$("#enablePushBtn").addEventListener("click", () => show("Alertes push bientôt disponibles", "Le centre de notifications est prêt. Les alertes sur l'appareil seront activées après la configuration du service push."));
$("#signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const displayName = String(form.get("name") || "").trim();
  const username = String(form.get("username") || "").trim().toLowerCase();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return accountMessage("Nom d'utilisateur invalide.", true);
  accountMessage("Création du compte…");
  const { error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName, username } }
  });
  if (error) return accountMessage(error.message, true);
  accountMessage("Compte créé. Vérifie ton e-mail si une confirmation est demandée.");
});
$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  accountMessage("Connexion…");
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") || "").trim(),
    password: String(form.get("password") || "")
  });
  if (error) return accountMessage(error.message, true);
  accountDialog.close();
  show("Connexion réussie", "Tu es connecté à ton espace À TA PLACE.");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  const installPrompt = event;
  $("#installBtn").hidden = false;
  $("#installBtn").onclick = async () => {
    await installPrompt.prompt();
    $("#installBtn").hidden = true;
  };
});

supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession;
  currentUser = newSession?.user || null;
  $("#profileBtn").textContent = currentUser ? (currentUser.user_metadata?.display_name || "M").slice(0, 1).toUpperCase() : "?";
  loadFeed();
  if (!notificationPage.hidden) loadNotifications();
});
const { data: sessionData } = await supabase.auth.getSession();
session = sessionData.session;
currentUser = session?.user || null;
$("#profileBtn").textContent = currentUser ? (currentUser.user_metadata?.display_name || "M").slice(0, 1).toUpperCase() : "?";
await loadFeed();
if (location.hash === "#notifications") showNotifications();

// Load the moderator workspace only after the Supabase client is ready.
await import("./moderation-ui.js");
