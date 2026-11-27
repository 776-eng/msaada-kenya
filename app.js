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
    const searchMatches = searchableText.includes(query);
    const show = categoryMatches && searchMatches;

    card.hidden = !show;
    if (show) visible += 1;
  });

  resultCount.textContent = visible + (visible === 1 ? " resource" : " resources");
  emptyState.hidden = visible !== 0;
}

searchInput.addEventListener("input", updateResources);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    updateResources();
  });
});

filterButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.classList.contains("active")));
});

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
    const searchMatches = (card.dataset.search + " " + card.innerText).toLowerCase().includes(query);
    const show = categoryMatches && searchMatches;
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
  try { savedPlatforms = JSON.parse(localStorage.getItem("msaada-saved-platforms") || "[]"); } catch (_) { savedPlatforms = []; }

  document.querySelectorAll(".save-opportunity").forEach((button) => {
    const card = button.closest(".opportunity-card");
    const platform = card.querySelector("h3").textContent;
    const refreshButton = () => {
      const saved = savedPlatforms.includes(platform);
      button.setAttribute("aria-pressed", String(saved));
      button.textContent = saved ? "★ Saved" : "☆ Save";
    };
    refreshButton();
    button.addEventListener("click", () => {
      savedPlatforms = savedPlatforms.includes(platform)
        ? savedPlatforms.filter((name) => name !== platform)
        : [...savedPlatforms, platform];
      try { localStorage.setItem("msaada-saved-platforms", JSON.stringify(savedPlatforms)); } catch (_) {}
      refreshButton();
    });
  });
  updateOpportunities();
}
