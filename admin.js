let supabase = null;

const authPanel = document.querySelector("#auth-panel");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");
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

function setMessage(text, isError = false, area = "login") {
  const target = area === "dashboard" ? dashboardMessage : loginMessage;
  if (!target) return;
  target.textContent = text;
  target.style.color = isError ? "#a3453d" : "#36724f";
}

function withTimeout(promise, label = "The request", milliseconds = 15000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(
      label + " is taking too long. Check your internet connection and try again."
    )), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
  setMessage("Loading your listings…", false, "dashboard");
  const { data, error } = await withTimeout(
    supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
    "Loading your listings"
  );
  if (error) throw error;
  posts = data || [];
  render();
  setMessage(posts.length ? "Your listings are up to date." : "You are signed in. Add your first opportunity.", false, "dashboard");
}

async function showDashboard(user) {
  setMessage("Checking administrator permissions…", false, "login");

  const { data: isAdmin, error } = await withTimeout(
    supabase.rpc("is_admin"),
    "Checking administrator permissions"
  );

  if (error) throw error;
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error("This account is signed in but is not authorised as an administrator. Check its user ID in the admin_users table.");
  }

  currentUser = user;
  signedInAs.textContent = "Signed in as " + (user.email || "administrator");
  authPanel.hidden = true;
  dashboard.hidden = false;

  try {
    await loadPosts();
  } catch (problem) {
    setMessage(problem.message || "Could not load your listings.", true, "dashboard");
    throw problem;
  }
}

async function initialise() {
  try {
    const config = window.MSAADA_SUPABASE_CONFIG;

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("The Supabase library did not load. Check your internet connection and refresh this page.");
    }
    if (!config || !config.url || !config.publishableKey) {
      throw new Error("Supabase settings are missing. Please check supabase-config.js.");
    }

    supabase = window.supabase.createClient(config.url, config.publishableKey);

    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      "Checking your existing sign-in"
    );
    if (error) throw error;

    if (data.session) {
      try {
        await showDashboard(data.session.user);
      } catch (problem) {
        console.error("Msaada Kenya dashboard initialisation:", problem);
        if (dashboard.hidden) {
          authPanel.hidden = false;
          setMessage(problem.message || "Please sign in again.", true, "login");
        }
      }
    }
  } catch (problem) {
    console.error("Msaada Kenya setup error:", problem);
    setMessage(problem.message || "The admin page could not connect. Refresh and try again.", true, "login");
    loginButton.disabled = true;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabase) {
    setMessage("The database connection is not ready. Refresh the page and try again.", true);
    return;
  }

  loginButton.disabled = true;
  setMessage("Signing in… Please wait.");

  const email = document.querySelector("#login-email").value.trim();
  const password = document.querySelector("#login-password").value;

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      "Signing in"
    );
    if (error) throw error;
    await showDashboard(data.user);
  } catch (problem) {
    dashboard.hidden = true;
    authPanel.hidden = false;
    setMessage(problem.message || "Unable to sign in. Please try again.", true);
    console.error("Msaada Kenya sign-in error:", problem);
  } finally {
    loginButton.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  try {
    const { error } = await withTimeout(supabase.auth.signOut(), "Signing out");
    if (error) throw error;
    currentUser = null;
    posts = [];
    dashboard.hidden = true;
    authPanel.hidden = false;
    resetForm();
    setMessage("You have signed out.");
  } catch (problem) {
    setMessage(problem.message || "Unable to sign out.", true, "dashboard");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  let parsedUrl;
  try {
    parsedUrl = new URL(fields.url.value.trim());
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
  } catch (_) {
    setMessage("Please enter a valid http or https link.", true, "dashboard");
    return;
  }

  saveButton.disabled = true;
  setMessage("Saving opportunity…", false, "dashboard");

  const payload = {
    title: fields.title.value.trim(),
    category: fields.type.value,
    organisation: fields.organisation.value.trim(),
    description: fields.description.value.trim(),
    application_url: parsedUrl.href,
    deadline: fields.deadline.value || null
  };

  try {
    let result;
    if (fields.id.value) {
      result = await withTimeout(
        supabase.from("opportunities").update(payload).eq("id", Number(fields.id.value)),
        "Updating the opportunity"
      );
    } else {
      result = await withTimeout(
        supabase.from("opportunities").insert({ ...payload, created_by: currentUser.id }),
        "Saving the opportunity"
      );
    }

    if (result.error) throw result.error;
    resetForm();
    await loadPosts();
    setMessage("Listing saved successfully.", false, "dashboard");
  } catch (problem) {
    setMessage(problem.message || "Unable to save this opportunity.", true, "dashboard");
  } finally {
    saveButton.disabled = false;
  }
});

list.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const post = posts.find((item) => String(item.id) === button.dataset.id);
  if (!post) return;

  try {
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
      const { error } = await withTimeout(
        supabase.from("opportunities").update({
          status: post.status === "published" ? "draft" : "published"
        }).eq("id", post.id),
        "Updating the listing status"
      );
      if (error) throw error;
      await loadPosts();
    } else if (button.dataset.action === "delete") {
      if (!confirm("Delete this opportunity permanently?")) return;
      const { error } = await withTimeout(
        supabase.from("opportunities").delete().eq("id", post.id),
        "Deleting the opportunity"
      );
      if (error) throw error;
      await loadPosts();
      if (String(fields.id.value) === String(post.id)) resetForm();
    }
  } catch (problem) {
    setMessage(problem.message || "That action could not be completed.", true, "dashboard");
  }
});

initialise();
