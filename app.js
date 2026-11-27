const searchInput = document.querySelector("#search-input");
const filterButtons = [...document.querySelectorAll(".filter")];
const cards = [...document.querySelectorAll(".resource-card")];
const emptyState = document.querySelector("#empty-state");
const resultCount = document.querySelector("#result-count");

let activeCategory = "all";

function updateResources() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const categoryMatches = activeCategory === "all" || card.dataset.category === activeCategory;
    const searchableText = (card.dataset.search + " " + card.innerText).toLowerCase();
    const show = categoryMatches && searchableText.includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  });
  resultCount.textContent = visible + (visible === 1 ? " resource" : " resources");
  emptyState.hidden = visible !== 0;
}
searchInput.addEventListener("input", updateResources);
filterButtons.forEach((button) => button.addEventListener("click", () => {
  activeCategory = button.dataset.filter;
  filterButtons.forEach((item) => {
    const selected = item === button;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  updateResources();
}));
filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.classList.contains("active"))));
document.querySelector("#year").textContent = new Date().getFullYear();
updateResources();

// Opportunity finder: directory search, category filters and browser-only saved items.
const opportunitySearch = document.querySelector("#opportunity-search");
const opportunityCards = [...document.querySelectorAll(".opportunity-card")];
const opportunityFilters = [...document.querySelectorAll("[data-op-filter]")];
const opportunityEmpty = document.querySelector("#opportunity-empty");
const opportunityCount = document.querySelector("#opportunity-count");
let activeOpportunityFilter = "all";

function updateOpportunities() {
  if (!opportunitySearch) return;
  const query = opportunitySearch.value.trim().toLowerCase();
  let visible = 0;
  opportunityCards.forEach((card) => {
    const kinds = card.dataset.kind.split(" ");
    const categoryMatches = activeOpportunityFilter === "all" || kinds.includes(activeOpportunityFilter);
    const show = categoryMatches && (card.dataset.search + " " + card.innerText).toLowerCase().includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  });
  opportunityCount.textContent = visible + (visible === 1 ? " directory" : " directories");
  opportunityEmpty.hidden = visible !== 0;
}
if (opportunitySearch) {
  opportunitySearch.addEventListener("input", updateOpportunities);
  opportunityFilters.forEach((button) => button.addEventListener("click", () => {
    activeOpportunityFilter = button.dataset.opFilter;
    opportunityFilters.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    updateOpportunities();
  }));
  let savedPlatforms = [];
  try { savedPlatforms = JSON.parse(localStorage.getItem("msaada-saved-platforms") || "[]"); } catch (_) {}
  document.querySelectorAll(".save-opportunity").forEach((button) => {
    const platform = button.closest(".opportunity-card").querySelector("h3").textContent;
    const refresh = () => {
      const saved = savedPlatforms.includes(platform);
      button.setAttribute("aria-pressed", String(saved));
      button.textContent = saved ? "★ Saved" : "☆ Save";
    };
    refresh();
    button.addEventListener("click", () => {
      savedPlatforms = savedPlatforms.includes(platform) ? savedPlatforms.filter((name) => name !== platform) : [...savedPlatforms, platform];
      try { localStorage.setItem("msaada-saved-platforms", JSON.stringify(savedPlatforms)); } catch (_) {}
      refresh();
    });
  });
  updateOpportunities();
}

// Public listings now come from Supabase, so every visitor sees the same published posts.
async function renderPublishedListings() {
  const container = document.querySelector("#public-listings");
  if (!container) return;
  const empty = document.querySelector("#listing-empty");
  const count = document.querySelector("#listing-count");
  container.replaceChildren();
  count.textContent = "Loading…";
  empty.hidden = true;

  try {
    const { data, error } = await window.msaadaSupabase
      .from("opportunities")
      .select("id,title,category,organisation,description,application_url,deadline,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;

    count.textContent = data.length + (data.length === 1 ? " listing" : " listings");
    empty.hidden = data.length > 0;
    data.forEach((post) => {
      const article = document.createElement("article");
      article.className = "listing-card";
      const kind = document.createElement("div");
      kind.className = "listing-kind";
      kind.textContent = String(post.category || "OPPORTUNITY").toUpperCase();
      const title = document.createElement("h3");
      title.textContent = post.title;
      const org = document.createElement("div");
      org.className = "listing-org";
      org.textContent = post.organisation;
      const desc = document.createElement("p");
      desc.textContent = post.description;
      const bottom = document.createElement("div");
      bottom.className = "listing-bottom";
      const link = document.createElement("a");
      link.href = post.application_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View application ↗";
      const deadline = document.createElement("time");
      deadline.textContent = post.deadline ? "Deadline: " + post.deadline : "";
      bottom.append(link, deadline);
      article.append(kind, title, org, desc, bottom);
      container.append(article);
    });
  } catch (error) {
    count.textContent = "Unable to load";
    empty.hidden = false;
    empty.querySelector("h3").textContent = "Opportunities are temporarily unavailable";
    empty.querySelector("p").textContent = "Please refresh the page or check back shortly.";
    console.error("Msaada Kenya listings:", error);
  }
}
renderPublishedListings();
