// Building the page's parts. Everything from the records goes in as text, never as HTML.

import { t, sportName, list, language } from "./strings.js";

/** `PlayerColor`: the system colors in light mode, and the neon ones. */
const playerColors = {
  red: "#FF3B30", green: "#34C759", blue: "#007AFF", orange: "#FF9500", yellow: "#FFCC00",
  brown: "#A2845E", pink: "#FF2D55", purple: "#AF52DE", teal: "#30B0C7", indigo: "#5856D6",
  mint: "#00C7BE", cyan: "#32ADE6", gray: "#8E8E93",
  neonGreen: "#A1FB00", neonYellow: "#FFE800", neonPink: "#FF2EA6", neonBlue: "#1FC8FF", neonRed: "#FF2B2B",
};
/** Light colors, which get dark initials when filled. */
const lightColors = new Set(["yellow", "mint", "cyan", "neonGreen", "neonYellow", "neonBlue"]);

export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "style") node.style.cssText = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : value);
  }
  node.append(...children.flat().filter((child) => child != null && child !== false));
  return node;
}

/** A player's circle with their initials: filled for the winners, outlined otherwise, as in the apps. */
function circle(player, filled) {
  const color = playerColors[player.color] ?? playerColors.gray;
  const classes = ["player", filled ? "is-filled" : "", lightColors.has(player.color) ? "is-light" : ""];
  return el("span", { class: classes.join(" ").trim(), style: `--player: ${color}`, "aria-hidden": "true" }, player.initials);
}

function team(players, filled) {
  return el("span", { class: "team" },
    el("span", { class: "circles" }, players.map((p) => circle(p, filled))),
    el("span", { class: "names" }, list(players.map((p) => p.name))));
}

function hidden(text) {
  return el("span", { class: "visually-hidden" }, text);
}

// MARK: Messages

/** A notice in place of the tournament: signing in, joining, errors. */
export function notice({ title, text, hint, button, secondary }) {
  return el("div", { class: "t-notice" },
    el("h2", {}, title),
    text ? el("p", {}, text) : null,
    hint ? el("p", { class: "t-hint" }, hint) : null,
    button ? el("button", { class: "t-button", type: "button", onclick: button.action, disabled: button.disabled }, button.label) : null,
    secondary ?? null);
}

/** "Loading…", with the number of records so far while a big zone loads. */
export function loading(count) {
  return el("p", { class: "t-status", role: "status" },
    count ? `${t("loading")} (${count.toLocaleString(language)})` : t("loading"));
}

// MARK: Tournament

/** The hero: the sport's icon and name, and the tournament's title. */
export function updateHero(hero, { title, sport, apps }) {
  const slug = sport === "tableTennis" ? "table-tennis" : sport;
  const app = apps.find((a) => a.slug === slug);
  if (app) {
    document.body.style.setProperty("--accent", app.color);
    if (app.ink) document.body.style.setProperty("--ink", app.ink);
    hero.icon.src = `/assets/apps/${app.slug}/icon.svg`;
    hero.icon.hidden = false;
  }
  hero.sport.textContent = sport ? sportName(sport) : "";
  hero.title.textContent = title;
  document.title = title ? `${title} · ${sportName(sport)}` : document.title;
}

export function tournamentView(model, { grouping, onGrouping, updatedAt, loadingCount, onSignOut }) {
  return el("div", { class: "t-tournament" },
    loadingCount ? el("p", { class: "t-status t-loading-more", role: "status" }, loading(loadingCount).textContent) : null,
    model.live.length ? liveSection(model.live) : null,
    rankingSection(model, grouping, onGrouping),
    resultsSection(model.results),
    el("p", { class: "t-footer" },
      el("span", { "data-updated": "" }, updatedText(updatedAt)),
      " · ",
      el("button", { class: "t-link", type: "button", onclick: onSignOut }, t("signOut"))));
}

export function updatedText(date) {
  return date ? t("updated", { time: date.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }) }) : "";
}

function rankingSection(model, grouping, onGrouping) {
  const toggle = el("div", { class: "t-segments", role: "group", "aria-label": t("ranking") },
    ["player", "team"].map((value) => el("button", {
      type: "button",
      class: value === grouping ? "is-selected" : "",
      "aria-pressed": String(value === grouping),
      onclick: () => onGrouping(value),
    }, t(value === "player" ? "byPlayer" : "byTeam"))));

  if (!model.rankings.length) {
    return el("section", { class: "t-section" },
      el("div", { class: "t-section-head" }, el("h2", {}, t("ranking")), toggle),
      el("p", { class: "t-empty" }, t("noMatches")));
  }

  const rows = model.rankings.map((r) => {
    const percent = r.percentage == null ? 0 : Math.round(r.percentage);
    return el("tr", {},
      el("th", { scope: "row" }, team(r.players, true)),
      el("td", {}, String(r.wins)),
      el("td", {}, String(r.losses)),
      el("td", {}, String(percent)));
  });
  return el("section", { class: "t-section" },
    el("div", { class: "t-section-head" }, el("h2", {}, t("ranking")), toggle),
    el("div", { class: "t-card t-scroll" },
      el("table", { class: "t-ranking" },
        el("thead", {}, el("tr", {},
          el("th", { scope: "col" }, t("name")),
          el("th", { scope: "col" }, t("won")),
          el("th", { scope: "col" }, t("lost")),
          el("th", { scope: "col" }, t("percent")))),
        el("tbody", {}, rows))));
}

function liveSection(matches) {
  return el("section", { class: "t-section" },
    el("h2", {}, t("playingNow")),
    el("ul", { class: "t-matches t-card" }, matches.map((m) => matchRow(m, { live: true }))));
}

function resultsSection(results) {
  if (!results.length) {
    return el("section", { class: "t-section" }, el("h2", {}, t("results")), el("p", { class: "t-empty" }, t("noMatches")));
  }
  const dayFormat = new Intl.DateTimeFormat(language, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const days = [];
  for (const match of results) {
    const key = match.date ? match.date.toDateString() : "";
    if (days.at(-1)?.key !== key) days.push({ key, date: match.date, matches: [] });
    days.at(-1).matches.push(match);
  }
  return el("section", { class: "t-section" },
    el("h2", {}, t("results")),
    days.map((day) => el("div", { class: "t-day" },
      el("h3", {}, day.date ? dayFormat.format(day.date) : "—"),
      el("ul", { class: "t-matches t-card" }, day.matches.map((m) => matchRow(m))))));
}

/** A match: both sides and the score, read out as one sentence like in the apps. */
function matchRow(match, { live = false } = {}) {
  const usNames = list(match.us.map((p) => p.name));
  const themNames = list(match.them.map((p) => p.name));
  const usScore = live ? match.gamesUs : match.usScore;
  const themScore = live ? match.gamesThem : match.themScore;
  const sentence = [t("versus", { us: usNames, them: themNames }), t("scoreTo", { us: usScore, them: themScore })];
  if (match.winner === 0 || match.winner === 1) {
    sentence.push(t("wonBy", { names: match.winner === 0 ? usNames : themNames }));
  }
  if (live) sentence.push(t("live"));

  const parts = match.parts.map((p) =>
    `${p.us}–${p.them}${p.tiebreakUs != null && p.tiebreakThem != null ? ` (${p.tiebreakUs}–${p.tiebreakThem})` : ""}`);

  return el("li", { class: "t-match" },
    hidden(sentence.join(", ")),
    el("div", { class: "t-match-row", "aria-hidden": "true" },
      el("div", { class: `t-side${match.winner === 0 ? " is-winner" : ""}` }, team(match.us, live || match.winner === 0)),
      el("div", { class: "t-score" },
        live ? el("span", { class: "t-live" }, t("live")) : null,
        el("strong", {}, `${usScore} – ${themScore}`),
        parts.length ? el("span", { class: "t-parts" }, parts.join(", ")) : null),
      el("div", { class: `t-side is-them${match.winner === 1 ? " is-winner" : ""}` }, team(match.them, live || match.winner === 1))));
}
