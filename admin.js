const { url, publishableKey } = window.MSAADA_SUPABASE_CONFIG;
const supabase = window.supabase.createClient(url, publishableKey);
const authPanel = document.querySelector("#auth-panel");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const loginButton = document.querySelector("#login-button");
const dashboard = document.querySelector("#dashboard");
const signedInAs = document.querySelector("#signed-in-as");
const signOutButton = document.querySelector("#sign-out");
const form = document.querySelector("#opportunity-form");
const fields = {
  id: document.querySelector("#post-id"),
  title: document.querySelector("#post-title"),
  type: document.querySelector("#post-type"),
  organisation: document.querySelector("#post-org"),
  description: document.querySelector("#post-description"),
  url: document.querySelector("#post-url"),
  deadline: document.querySelector("#post-deadline")
};
const list = document.querySelector("#admin-posts");
const empty = document.querySelector("#admin-empty");
const count = document.querySelector("#admin-count");
const formHeading = document.querySelector("#form-heading");
const saveButton = document.querySelector("#save-post");
const cancelButton = document.querySelector("#cancel-edit");
let currentUser = null;
let posts = [];

function message(text, isError = false) {
  loginMessage.textContent = text;
  loginMessage.style.color = isError ? "#a3453d" : "#36724f";
}
function resetForm() {
  form.reset();
  fields.id.value = "";
  formHeading.textContent = "Add an opportunity";
  saveButton.textContent = "Save as draft";
  cancelButton.hidden = true;
}
function makeButton(label, action, id, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "post-action " + extraClass;
  button.dataset.action = action;
  button.dataset.id = String(id);
  button.textContent = label;
  return button;
}
function render() {
  list.replaceChildren();
  count.textContent = posts.length + (posts.length === 1 ? " listing" : " listings");
  empty.hidden = posts.length > 0;
  posts.forEach((post) => {
    const item = document.createElement("article");
    item.className = "admin-post";
    const head = document.createElement("div");
    head.className = "admin-post-head";
    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = post.title;
    const meta = document.createElement("p");
    meta.textContent = post.category + " · " + post.organisation;
    details.append(title, meta);
    const status = document.createElement("span");
    status.className = "status-pill" + (post.status === "published" ? " published" : "");
    status.textContent = post.status;
    head.append(details, status);
    const description = document.createElement("p");
    description.textContent = post.description;
    const actions = document.createElement("div");
    actions.className = "post-actions";
    actions.append(
      makeButton("Edit", "edit", post.id),
      makeButton(post.status === "published" ? "Unpublish" : "Publish", "toggle", post.id),
      makeButton("Delete", "delete", post.id, "danger")
    );
    item.append(head, description, actions);
    list.append(item);
  });
}
async function loadPosts() {
  const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  posts = data || [];
  render();
}
async function showDashboard(user) {
  currentUser = user;
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error("This account is not authorised to manage Msaada Kenya.");
  }
  signedInAs.textContent = "Signed in as " + user.email;
  authPanel.hidden = true;
  dashboard.hidden = false;
  await loadPosts();
}
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  message("Signing in…");
  const email = document.querySelector("#login-email").value.trim();
  const password = document.querySelector("#login-password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  loginButton.disabled = false;
  if (error) { message(error.message, true); return; }
  try {
    await showDashboard(data.user);
    message("");
  } catch (problem) {
    dashboard.hidden = true;
    authPanel.hidden = false;
    message(problem.message || "Unable to load the admin dashboard.", true);
  }
});
signOutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  currentUser = null;
  posts = [];
  dashboard.hidden = true;
  authPanel.hidden = false;
  resetForm();
  message("You have signed out.");
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  let parsedUrl;
  try {
    parsedUrl = new URL(fields.url.value.trim());
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
  } catch (_) {
    message("Please enter a valid http or https link.", true);
    return;
  }
  saveButton.disabled = true;
  const payload = {
    title: fields.title.value.trim(),
    category: fields.type.value,
    organisation: fields.organisation.value.trim(),
    description: fields.description.value.trim(),
    application_url: parsedUrl.href,
    deadline: fields.deadline.value || null
  };
  let result;
  if (fields.id.value) {
    result = await supabase.from("opportunities").update(payload).eq("id", Number(fields.id.value));
  } else {
    result = await supabase.from("opportunities").insert({ ...payload, created_by: currentUser.id });
  }
  saveButton.disabled = false;
  if (result.error) { message(result.error.message, true); return; }
  resetForm();
  await loadPosts();
  message("Listing saved successfully.");
});
list.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const post = posts.find((item) => String(item.id) === button.dataset.id);
  if (!post) return;
  if (button.dataset.action === "edit") {
    fields.id.value = post.id;
    fields.title.value = post.title;
    fields.type.value = post.category;
    fields.organisation.value = post.organisation;
    fields.description.value = post.description;
    fields.url.value = post.application_url;
    fields.deadline.value = post.deadline || "";
    formHeading.textContent = "Edit opportunity";
    saveButton.textContent = "Update listing";
    cancelButton.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (button.dataset.action === "toggle") {
    const { error } = await supabase.from("opportunities").update({
      status: post.status === "published" ? "draft" : "published"
    }).eq("id", post.id);
    if (error) { message(error.message, true); return; }
    await loadPosts();
  } else if (button.dataset.action === "delete") {
    if (!confirm("Delete this opportunity permanently?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", post.id);
    if (error) { message(error.message, true); return; }
    await loadPosts();
    if (String(fields.id.value) === String(post.id)) resetForm();
  }
});
cancelButton.addEventListener("click", resetForm);

(async function init() {
  const { data, error } = await supabase.auth.getSession();
  if (error) { message(error.message, true); return; }
  if (data.session) {
    try { await showDashboard(data.session.user); }
    catch (problem) { message(problem.message || "Please sign in again.", true); }
  }
})();
