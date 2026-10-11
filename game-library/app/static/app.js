// Front end for the Game Library. Plain JavaScript, no build step.

const TOAST_MS = 4000;
const SEARCH_DELAY_MS = 250;

const state = {
  page: 1,
  search: "",
  status: "",
  platform: "",
  sort: "title",
  order: "asc",
  editingId: null,
  deletingId: null,
};

const el = (id) => document.getElementById(id);
const form = el("game-form");

// --- API helpers -----------------------------------------------------------

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

// --- Stats -----------------------------------------------------------------

async function loadStats() {
  const { body: stats } = await api("/api/stats");
  el("stat-total").textContent = stats.total;
  el("stat-completed").textContent = stats.by_status.completed;
  el("stat-completion-rate").textContent = `${stats.completion_rate}%`;
  el("stat-average-rating").textContent = stats.average_rating === null ? "–" : stats.average_rating.toFixed(1);
  el("stat-total-hours").textContent = stats.total_hours;
}

// --- Game list -------------------------------------------------------------

async function loadGames() {
  const params = new URLSearchParams({ page: state.page, sort: state.sort, order: state.order });
  if (state.search) params.set("search", state.search);
  if (state.status) params.set("status", state.status);
  if (state.platform) params.set("platform", state.platform);

  const { body: result } = await api(`/api/games?${params}`);

  // Deleting the last game on a page leaves that page empty, so step back
  if (result.items.length === 0 && state.page > 1) {
    state.page -= 1;
    return loadGames();
  }

  renderGames(result);
}

function renderGames(result) {
  const tbody = el("games-body");
  tbody.replaceChildren();

  for (const game of result.items) {
    const row = document.createElement("tr");
    row.dataset.gameId = game.id;

    for (const value of [
      game.title,
      game.platform,
      game.genre,
      game.status,
      game.rating ?? "–",
      game.hours_played,
      game.release_year ?? "–",
    ]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }

    const actions = document.createElement("td");
    actions.className = "actions";
    actions.append(
      actionButton("Edit", game, () => startEditing(game)),
      actionButton("Delete", game, () => askToDelete(game)),
    );
    row.append(actions);

    tbody.append(row);
  }

  el("games-table").hidden = result.items.length === 0;
  el("empty-message").hidden = result.items.length > 0;
  el("page-info").textContent = `Page ${result.page} of ${result.total_pages}`;
  const count = result.items.length;
  el("result-count").textContent = count === 1 ? "1 game" : `${count} games`;
  el("previous-page").disabled = result.page <= 1;
  el("next-page").disabled = result.page >= result.total_pages;
}

function actionButton(label, game, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-label", `${label} ${game.title}`);
  button.addEventListener("click", onClick);
  return button;
}

// --- Add and edit form -----------------------------------------------------

function readForm() {
  const numberOrNull = (id) => (el(id).value.trim() === "" ? null : Number(el(id).value));
  return {
    title: el("title").value,
    platform: el("platform").value,
    genre: el("genre").value,
    status: el("status").value,
    rating: numberOrNull("rating"),
    hours_played: numberOrNull("hours_played") ?? 0,
    release_year: numberOrNull("release_year"),
  };
}

function clearErrors() {
  el("form-error").textContent = "";
  for (const message of form.querySelectorAll(".field-error")) message.textContent = "";
  for (const input of form.querySelectorAll("[aria-invalid]")) input.removeAttribute("aria-invalid");
}

// The API reports problems as a list of {loc: ["body", field], msg}
function showErrors(detail) {
  if (!Array.isArray(detail)) {
    el("form-error").textContent = detail;
    return;
  }
  for (const error of detail) {
    const field = error.loc[error.loc.length - 1];
    const message = form.querySelector(`[data-error-for="${field}"]`);
    if (message) {
      message.textContent = error.msg;
      el(field).setAttribute("aria-invalid", "true");
    } else {
      el("form-error").textContent = error.msg;
    }
  }
}

function startEditing(game) {
  state.editingId = game.id;
  clearErrors();
  el("title").value = game.title;
  el("platform").value = game.platform;
  el("genre").value = game.genre;
  el("status").value = game.status;
  el("rating").value = game.rating ?? "";
  el("hours_played").value = game.hours_played;
  el("release_year").value = game.release_year ?? "";
  el("form-heading").textContent = "Edit game";
  el("save-button").textContent = "Save changes";
  el("cancel-button").hidden = false;
  el("title").focus();
}

function resetForm() {
  form.reset();
  clearErrors();
  el("form-heading").textContent = "Add a game";
  el("save-button").textContent = "Add game";
  el("cancel-button").hidden = true;
}

function stopEditing() {
  state.editingId = null;
  resetForm();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const editing = state.editingId !== null;
  const { response, body } = await api(editing ? `/api/games/${state.editingId}` : "/api/games", {
    method: editing ? "PUT" : "POST",
    body: JSON.stringify(readForm()),
  });

  if (!response.ok) {
    showErrors(body.detail);
    return;
  }

  stopEditing();
  showToast(editing ? "Game updated" : "Game added");
  await Promise.all([loadGames(), loadStats()]);
});

el("cancel-button").addEventListener("click", resetForm);

// --- Delete ----------------------------------------------------------------

function askToDelete(game) {
  state.deletingId = game.id;
  el("delete-message").textContent = `Delete "${game.title}" from your library?`;
  el("delete-dialog").showModal();
}

el("delete-cancel").addEventListener("click", () => el("delete-dialog").close());

el("delete-confirm").addEventListener("click", async () => {
  el("delete-dialog").close();
  await api(`/api/games/${state.deletingId}`, { method: "DELETE" });

  if (state.editingId === state.deletingId) stopEditing();
  showToast("Game deleted");
  await Promise.all([loadGames(), loadStats()]);
});

// --- Filters, sorting and paging -------------------------------------------

let searchTimer;
el("search").addEventListener("input", (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = event.target.value;
    state.page = 1;
    loadGames();
  }, SEARCH_DELAY_MS);
});

el("filter-status").addEventListener("change", (event) => {
  state.status = event.target.value;
  state.page = 1;
  loadGames();
});

el("filter-platform").addEventListener("change", (event) => {
  state.platform = event.target.value;
  state.page = 1;
  loadGames();
});

el("sort").addEventListener("change", (event) => {
  [state.sort, state.order] = event.target.value.split(":");
  state.page = 1;
  loadGames();
});

el("previous-page").addEventListener("click", () => {
  state.page -= 1;
  loadGames();
});

el("next-page").addEventListener("click", () => {
  state.page += 1;
  loadGames();
});

// --- Toast -----------------------------------------------------------------

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  el("toast").textContent = message;
  toastTimer = setTimeout(() => (el("toast").textContent = ""), TOAST_MS);
}

// --- Start up --------------------------------------------------------------

function fillSelect(select, values) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

async function start() {
  const { body: config } = await api("/api/config");
  fillSelect(el("platform"), config.platforms);
  fillSelect(el("status"), config.statuses);
  fillSelect(el("filter-platform"), config.platforms);
  fillSelect(el("filter-status"), config.statuses);

  await Promise.all([loadGames(), loadStats()]);
}

start();
