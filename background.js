// Chrome acilisinda gruplanmis ve sabitlenmis sekmeleri uyku modunda baslat.
// Aktif sekme discard edilemez.

const NO_GROUP = -1; // chrome.tabGroups.TAB_GROUP_ID_NONE

async function sleepGroupedTabs() {
  let tabs;
  try {
    tabs = await chrome.tabs.query({});
  } catch (e) {
    console.warn("tabs.query basarisiz", e);
    return;
  }
  for (const t of tabs) {
    if (t.groupId === NO_GROUP && !t.pinned) continue; // ne gruplu ne sabit
    if (t.active) continue;                // aktif sekme uyutulamaz
    if (t.discarded) continue;             // zaten uyuyor
    try {
      await chrome.tabs.discard(t.id);
    } catch (e) {
      console.warn("discard basarisiz", t.id, e);
    }
  }
}

// Session restore biraz surebilir; birkac kez dene ki geç yuklenen
// gruplu sekmeler de yakalansin.
function runWithRetries() {
  sleepGroupedTabs();
  setTimeout(sleepGroupedTabs, 1500);
  setTimeout(sleepGroupedTabs, 4000);
}

chrome.runtime.onStartup.addListener(runWithRetries);
// Eklenti yuklendiginde/guncellendiginde de bir kez uygula (test icin).
chrome.runtime.onInstalled.addListener(runWithRetries);
