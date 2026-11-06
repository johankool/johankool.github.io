// A tournament shared from the apps, for the people it's shared with: /tournament/#<share ID>.
//
// 1. Sign in with an Apple ID (CloudKit's sign-in popup).
// 2. Resolve the share: its tournament, and whether this Apple ID owns it, joined it, or may join.
// 3. Read the zone: for whoever it's shared with, the shared zone, which holds only what's shared. For
//    the owner, their private zone, which holds every match they ever played: CloudKit can't filter it
//    by tournament (the columns are encrypted), so only the tables and columns the page shows are
//    fetched (no event logs) and the rest of the tournaments is dropped here.
// 4. Keep it current with the zone's changes every 30 seconds while the page is visible.
//
// The zone's records are cached in the browser per Apple ID and zone (cache.js): a later visit shows
// them right away and only fetches what changed since. Signing out forgets them.

import { CloudKit, CloudKitError, SignInError } from "./cloudkit.js";
import { readZone, writeZone, removeZone, clearAll } from "./cache.js";
import { RecordStore, recordTypes, fields, tournament, recordID, row } from "./model.js";
import { el, notice, loading, updateHero, tournamentView, updatedText } from "./render.js";
import { t } from "./strings.js";

const refreshInterval = 30 * 1000;

const main = document.querySelector("[data-tournament]");
const content = main.querySelector("[data-content]");
const hero = {
  icon: main.querySelector("[data-sport-icon]"),
  sport: main.querySelector("[data-sport-name]"),
  title: main.querySelector("[data-title]"),
};
const apps = JSON.parse(document.getElementById("tournament-apps")?.textContent || "[]");

// Production unless ?env=development, for debug builds of the apps.
const environment = new URLSearchParams(location.search).get("env") === "development" ? "DEVELOPMENT" : "PRODUCTION";
const apiToken = environment === "PRODUCTION"
  ? main.dataset.productionToken
  // Locally, without a token in _config.yml, the one entered on the test page.
  : main.dataset.developmentToken || storedTestToken();
const cloudKit = new CloudKit({ container: main.dataset.container, environment, apiToken });

const state = {
  shortGuid: null,
  tournamentID: null,
  databaseType: "SHARED",
  zoneName: null,
  userRecordName: null,
  cacheKey: null,
  store: new RecordStore(),
  changeToken: null,
  grouping: "player",
  updatedAt: null,
  timer: null,
  refreshing: false,
};

function storedTestToken() {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) return null;
  try {
    return localStorage.getItem("ckApiToken");
  } catch {
    return null;
  }
}

function show(...nodes) {
  content.replaceChildren(...nodes);
}

/** The share ID from the link: #<shortGuid>, perhaps followed by the title like iCloud's links. */
function shareFromLink() {
  const value = decodeURIComponent(location.hash.slice(1)).split(/[/#?]/)[0].trim();
  return /^[A-Za-z0-9_-]{10,}$/.test(value) ? value : null;
}

async function start() {
  stopRefreshing();
  state.shortGuid = shareFromLink();
  state.store = new RecordStore();
  state.changeToken = null;
  if (!state.shortGuid) {
    show(notice({ title: t("noLinkTitle"), text: t("noLinkText") }));
    return;
  }
  if (!apiToken) {
    showError(new Error(`No API token for ${environment.toLowerCase()}`));
    return;
  }
  if (!cloudKit.isSignedIn) {
    showSignIn();
    return;
  }
  show(loading());
  try {
    await open();
  } catch (error) {
    handle(error);
  }
}

function showSignIn(message) {
  const button = { label: t("signIn"), action: signIn };
  show(notice({ title: t("signInTitle"), text: t("signInText"), hint: message, button }));
}

async function signIn(event) {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = t("signingIn");
  try {
    await cloudKit.signIn();
    show(loading());
    await open();
  } catch (error) {
    if (error instanceof SignInError) {
      const message = error.reason === "popupBlocked" ? t("popupBlocked")
        : error.reason === "cancelled" ? t("signInCancelled")
        : error.message;
      showSignIn(message);
    } else {
      handle(error);
    }
  }
}

async function open() {
  const [share, userRecordName] = await Promise.all([
    cloudKit.resolveShare(state.shortGuid, ["title", "sport"]),
    cloudKit.currentUser(),
  ]);
  state.userRecordName = userRecordName;
  state.tournamentID = recordID(share.rootRecordName ?? share.rootRecord?.recordName);
  if (share.rootRecord) {
    const root = row(share.rootRecord);
    updateHero(hero, { title: root.title ?? "", sport: root.sport, apps });
  }

  if (share.participantType !== "OWNER" && share.participantStatus !== "ACCEPTED") {
    show(notice({
      title: t("joinTitle"),
      text: t("joinText"),
      button: { label: t("join"), action: join },
      secondary: signOutLink(),
    }));
    return;
  }
  await load(share);
}

async function join(event) {
  event.currentTarget.disabled = true;
  try {
    await cloudKit.acceptShare(state.shortGuid);
    show(loading());
    await open();
  } catch (error) {
    handle(error);
  }
}

/** Finds the tournament's zone (the owner's private one, or the shared one) and reads it. */
async function load(share) {
  state.databaseType = share.participantType === "OWNER" ? "PRIVATE" : "SHARED";
  const zones = await cloudKit.zones(state.databaseType);
  const wanted = share.zone ?? share.rootRecord?.zone;
  const zone = zones.find((z) =>
    z.zoneName === wanted?.zoneName && (!wanted?.ownerRecordName || z.ownerRecordName === wanted.ownerRecordName));
  if (!zone) {
    show(notFound());
    return;
  }
  state.zoneName = zone.canonicalName ?? zone.zoneName;
  state.cacheKey = state.userRecordName
    ? [main.dataset.container, environment, state.userRecordName, state.databaseType, state.zoneName].join("|")
    : null;

  const cached = state.cacheKey ? await readZone(state.cacheKey) : null;
  if (cached?.records?.length && cached.changeToken) {
    // Show what's cached right away, then fetch only what changed since.
    state.store.apply(cached.records.map((record) => ({ type: "existing", record })));
    state.changeToken = cached.changeToken;
    state.updatedAt = cached.savedAt ? new Date(cached.savedAt) : null;
    if (tournament(state.store, state.tournamentID)) render();
    try {
      await refresh({ strict: true });
    } catch (error) {
      if (error instanceof CloudKitError && error.needsSignIn) throw error;
      // An expired change token or a reset zone: start over.
      console.warn("Couldn't update the cached tournament, loading it again", error);
      await removeZone(state.cacheKey);
      state.store = new RecordStore();
      state.changeToken = null;
      await refresh({ initial: true });
    }
  } else {
    await refresh({ initial: true });
  }
  startRefreshing();
}

/**
 * Applies the zone's changes since the last time (all of it the first time), shows the result and
 * caches it. A failed regular refresh keeps what's shown; `initial` and `strict` ones throw.
 */
async function refresh({ initial = false, strict = false } = {}) {
  if (state.refreshing) return;
  state.refreshing = true;
  try {
    let changed = false;
    const { changeToken } = await cloudKit.changes(state.databaseType, state.zoneName, {
      changeToken: state.changeToken,
      recordTypes,
      fields,
      // A big zone (the owner's) comes in several batches: show what's there after each one, and that
      // more is coming, rather than waiting for all of it.
      onBatch: (batch, { moreComing, count }) => {
        changed = state.store.apply(batch) || changed;
        if (initial && moreComing) render({ loadingCount: count });
      },
    });
    const tokenChanged = changeToken !== state.changeToken;
    state.changeToken = changeToken;
    state.updatedAt = new Date();
    if (changed || initial || strict) render();
    else updateFooter();
    if ((changed || tokenChanged || initial) && state.cacheKey) {
      writeZone(state.cacheKey, { records: state.store.all(), changeToken });
    }
  } catch (error) {
    if (initial || strict || (error instanceof CloudKitError && error.needsSignIn)) throw error;
    // A failed refresh keeps what's shown; the next one tries again.
    console.warn("Couldn't refresh the tournament", error);
  } finally {
    state.refreshing = false;
  }
}

/** Shows the tournament; while the first load is still going (`loadingCount`), what's there so far. */
function render({ loadingCount } = {}) {
  const model = tournament(state.store, state.tournamentID, { grouping: state.grouping });
  if (!model) {
    if (loadingCount) {
      // The tournament's own record hasn't come in yet.
      show(loading(loadingCount));
      return;
    }
    stopRefreshing();
    show(notFound());
    return;
  }
  updateHero(hero, { title: model.title, sport: model.sport, apps });
  show(tournamentView(model, {
    grouping: state.grouping,
    onGrouping: (grouping) => {
      state.grouping = grouping;
      render({ loadingCount: state.loadingCount });
    },
    updatedAt: loadingCount ? null : state.updatedAt,
    loadingCount,
    onSignOut: signOut,
  }));
  state.loadingCount = loadingCount;
}

/** Only the "Updated" time changes when nothing else did, so focus and scrolling stay put. */
function updateFooter() {
  const updated = content.querySelector("[data-updated]");
  if (updated) updated.textContent = updatedText(state.updatedAt);
}

function startRefreshing() {
  stopRefreshing();
  state.timer = setInterval(() => {
    if (document.visibilityState === "visible") refresh().catch(handle);
  }, refreshInterval);
}

function stopRefreshing() {
  clearInterval(state.timer);
  state.timer = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.timer && Date.now() - (state.updatedAt ?? 0) > refreshInterval) {
    refresh().catch(handle);
  }
});

function signOut() {
  stopRefreshing();
  cloudKit.signOut();
  // Someone else may use this browser next: forget the cached tournaments too.
  clearAll();
  state.store = new RecordStore();
  state.changeToken = null;
  showSignIn();
}

function signOutLink() {
  return el("p", { class: "t-footer" }, el("button", { class: "t-link", type: "button", onclick: signOut }, t("signOut")));
}

function notFound() {
  return notice({ title: t("notFoundTitle"), text: t("notFoundText"), secondary: signOutLink() });
}

function handle(error) {
  console.error(error);
  stopRefreshing();
  if (error instanceof CloudKitError) {
    if (error.needsSignIn) {
      cloudKit.signOut();
      showSignIn();
      return;
    }
    // An unknown share, one this Apple ID may not see, or a zone that's gone (left or deleted).
    if ([400, 403, 404].includes(error.status)) {
      show(notFound());
      return;
    }
  }
  showError(error);
}

function showError(error) {
  show(notice({
    title: t("errorTitle"),
    text: error.message,
    hint: t("errorHint"),
    button: { label: t("tryAgain"), action: start },
    secondary: cloudKit.isSignedIn ? signOutLink() : null,
  }));
}

window.addEventListener("hashchange", start);
start();
