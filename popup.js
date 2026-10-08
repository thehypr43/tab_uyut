const listEl = document.getElementById("list");
const selectAllEl = document.getElementById("selectAll");
const sleepBtn = document.getElementById("sleepBtn");
const countEl = document.getElementById("count");

let lastIndex = null;

function selectableBoxes() {
  return [...listEl.querySelectorAll("input[type=checkbox]:not(:disabled)")];
}

function onBoxClick(e) {
  const boxes = selectableBoxes();
  const idx = boxes.indexOf(e.currentTarget);
  if (e.shiftKey && lastIndex !== null) {
    const [a, b] = [lastIndex, idx].sort((x, y) => x - y);
    const val = e.currentTarget.checked;
    for (let i = a; i <= b; i++) boxes[i].checked = val;
    updateState();
  }
  lastIndex = idx;
}

function checkedBoxes() {
  return selectableBoxes().filter((b) => b.checked);
}

function updateState() {
  const sel = checkedBoxes();
  countEl.textContent = `${sel.length} secili`;
  sleepBtn.disabled = sel.length === 0;
  const boxes = selectableBoxes();
  selectAllEl.checked = boxes.length > 0 && sel.length === boxes.length;
  selectAllEl.indeterminate = sel.length > 0 && sel.length < boxes.length;
}

function faviconUrl(tab) {
  if (tab.favIconUrl && tab.favIconUrl.startsWith("http")) return tab.favIconUrl;
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' rx='3' fill='%23bbb'/%3E%3C/svg%3E";
}

function makeRow(tab) {
  const row = document.createElement("label");
  row.className = "row";
  if (tab.active) row.classList.add("active");

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.dataset.tabId = String(tab.id);
  // Aktif sekme discard edilemez.
  cb.disabled = tab.active;
  cb.addEventListener("click", onBoxClick);
  cb.addEventListener("change", updateState);

  const icon = document.createElement("img");
  icon.className = "fav";
  icon.src = faviconUrl(tab);
  icon.onerror = () => { icon.style.visibility = "hidden"; };

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = tab.title || tab.url || "(baslik yok)";
  title.title = title.textContent;

  const tag = document.createElement("span");
  tag.className = "tag";
  if (tab.active) tag.textContent = "aktif";

  row.append(cb, icon, title, tag);
  return row;
}

async function render() {
  const tabs = (await chrome.tabs.query({})).filter((t) => !t.discarded);
  listEl.innerHTML = "";
  lastIndex = null;
  for (const tab of tabs) listEl.append(makeRow(tab));
  updateState();
}

selectAllEl.addEventListener("change", () => {
  const want = selectAllEl.checked;
  for (const b of selectableBoxes()) b.checked = want;
  updateState();
});

sleepBtn.addEventListener("click", async () => {
  sleepBtn.disabled = true;
  const ids = checkedBoxes().map((b) => Number(b.dataset.tabId));
  for (const id of ids) {
    try {
      await chrome.tabs.discard(id);
    } catch (e) {
      // Sekme kapanmis / discard edilemez olabilir; atla.
      console.warn("discard basarisiz", id, e);
    }
  }
  await render();
});

render();
