const supabase = window.atpSupabase;
const button = document.querySelector("#moderationBtn");
const page = document.querySelector("#moderationPage");
const list = document.querySelector("#moderationList");
const summary = document.querySelector("#moderationSummary");
const feedSelectors = [".welcome", ".composer-card", ".feed-tabs", ".feed-heading", "#feed", ".bottom-note"];
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

function showModerationPage() {
  feedSelectors.forEach((selector) => { const node = document.querySelector(selector); if (node) node.hidden = true; });
  document.querySelector("#notificationsPage").hidden = true;
  page.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadQueue();
}
function closeModerationPage() {
  page.hidden = true;
  feedSelectors.forEach((selector) => { const node = document.querySelector(selector); if (node) node.hidden = false; });
}
async function checkModerator() {
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) { button.hidden = true; return; }
  const { error } = await supabase.functions.invoke("moderation", { method: "GET" });
  button.hidden = Boolean(error);
}
async function loadQueue() {
  summary.textContent = "Chargement de la file…";
  list.innerHTML = "";
  const { data, error } = await supabase.functions.invoke("moderation", { method: "GET" });
  if (error) {
    summary.textContent = "Impossible de charger la modération.";
    list.innerHTML = '<div class="moderation-empty">Vérifie ta connexion et tes droits de modération.</div>';
    return;
  }
  const stories = data.stories || [];
  const comments = data.comments || [];
  summary.textContent = `${stories.length} situation(s) · ${comments.length} commentaire(s) en attente`;
  const cards = [
    ...stories.map((item) => ({ ...item, type: "story", typeLabel: "SITUATION" })),
    ...comments.map((item) => ({ ...item, type: "comment", typeLabel: "COMMENTAIRE" }))
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (!cards.length) {
    list.innerHTML = '<div class="moderation-empty">La file est vide. Aucun contenu à vérifier.</div>';
    return;
  }
  list.innerHTML = cards.map((item) => `
    <article class="moderation-card" data-id="${safe(item.id)}" data-type="${item.type}">
      <span class="moderation-tag">${item.typeLabel}</span>
      <h3>${safe(item.author || "Membre")}</h3>
      <div class="moderation-meta">${new Date(item.created_at).toLocaleString("fr-FR")}</div>
      ${item.type === "comment" ? `<div class="moderation-parent">Sous : ${safe(item.story_body)}</div>` : ""}
      <p>${safe(item.body)}</p>
      <div class="moderation-actions">
        <button class="moderation-approve" data-decision="approve">Approuver</button>
        <button class="moderation-reject" data-decision="reject">Refuser</button>
      </div>
    </article>`).join("");
}
async function decide(item, decision) {
  const buttons = item.querySelectorAll("button");
  buttons.forEach((node) => node.disabled = true);
  const { error } = await supabase.functions.invoke("moderation", {
    method: "POST",
    body: { type: item.dataset.type, id: item.dataset.id, decision }
  });
  if (error) {
    buttons.forEach((node) => node.disabled = false);
    summary.textContent = "Action impossible : réessaie.";
    return;
  }
  await loadQueue();
}
button.addEventListener("click", showModerationPage);
document.querySelector("#refreshModeration").addEventListener("click", loadQueue);
document.querySelector("#closeModeration").addEventListener("click", closeModerationPage);
list.addEventListener("click", (event) => {
  const action = event.target.closest("[data-decision]");
  if (action) decide(action.closest(".moderation-card"), action.dataset.decision);
});
supabase.auth.onAuthStateChange(() => { setTimeout(checkModerator, 0); });
checkModerator();
