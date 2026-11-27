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