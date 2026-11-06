// The tournament as the apps store it, read from CloudKit records.
//
// SQLiteData's records: the record type is the table name, the record name "<id>:<table>", and each
// column a field. Values newer app versions may write (sports, match states) are kept as they are and
// left out where the page doesn't know them, like the apps do.

/** Only the tables and columns the page shows: not the matches' event logs or rules. */
export const recordTypes = ["tournaments", "tournamentPlayers", "matches", "matchParts"];
export const fields = [
  "title", "sport",
  "tournamentId", "playerId", "name", "initials", "color", "isArchived",
  "usPlayer1Id", "usPlayer2Id", "themPlayer1Id", "themPlayer2Id", "us", "them", "state", "winner",
  "startDate", "endDate",
  "matchId", "number", "tiebreakUs", "tiebreakThem",
];

/** `Match.inactivityLimit`: a game counts as live until this long after its last rally. */
const inactivityLimit = 30 * 60 * 1000;

/** The records of a zone, kept up to date with its changes. */
export class RecordStore {
  constructor() {
    this.records = new Map();
  }

  /** Applies record results from the changes endpoint; returns whether anything changed. */
  apply(results) {
    let changed = false;
    for (const result of results) {
      if (result.type === "deleted" || result.deleted) {
        changed = this.records.delete(result.recordName) || changed;
      } else if (result.record) {
        const previous = this.records.get(result.record.recordName);
        if (previous?.recordChangeTag !== result.record.recordChangeTag || !previous) changed = true;
        this.records.set(result.record.recordName, result.record);
      }
    }
    return changed;
  }

  /** All records, to keep in the browser's cache. */
  all() {
    return [...this.records.values()];
  }

  rows(type) {
    const rows = [];
    for (const record of this.records.values()) {
      if (record.recordType === type) rows.push(row(record));
    }
    return rows;
  }
}

/** A record's columns, with its ID and when it last changed. */
export function row(record) {
  const values = { id: record.recordName.split(":")[0] };
  for (const [key, field] of Object.entries(record.fields ?? {})) {
    values[key] = field?.value;
  }
  values.modified = parseDate(record.modified?.timestamp);
  return values;
}

/** The ID in a record name ("<id>:<table>"). */
export function recordID(recordName) {
  return recordName?.split(":")[0];
}

/** Dates as SQLiteData stores them ("yyyy-MM-dd HH:mm:ss.SSS", UTC), or as CloudKit sends them. */
export function parseDate(value) {
  if (value == null) return null;
  if (typeof value === "number") return new Date(value < 1e11 ? value * 1000 : value);
  const text = String(value);
  const date = /^\d{4}-\d\d-\d\d[ T]\d\d:\d\d(:\d\d(\.\d+)?)?$/.test(text)
    ? new Date(`${text.replace(" ", "T")}Z`)
    : new Date(text);
  return isNaN(date) ? null : date;
}

const isTrue = (value) => value === true || value === 1 || value === "1";

/**
 * Everything the page shows of a tournament, as the iPhone's Home does: its finished matches as
 * results, the rankings of those (by player, with the rest of the roster at zero, or by team), and the
 * matches going on now.
 */
export function tournament(store, tournamentID, { grouping = "player", now = new Date() } = {}) {
  const info = store.rows("tournaments").find((t) => t.id === tournamentID);
  if (!info) return null;

  const roster = new Map(
    store.rows("tournamentPlayers").filter((p) => p.tournamentId === tournamentID).map((p) => [p.playerId, p]),
  );
  const player = (id) => {
    const entry = roster.get(id);
    return { id, name: entry?.name ?? "?", initials: entry?.initials ?? "?", color: entry?.color ?? "gray" };
  };
  const side = (id1, id2) => [id1, id2].filter(Boolean).map(player);

  const parts = new Map();
  for (const part of store.rows("matchParts")) {
    if (!parts.has(part.matchId)) parts.set(part.matchId, []);
    parts.get(part.matchId).push(part);
  }
  for (const list of parts.values()) list.sort((a, b) => a.number - b.number);

  const matches = store.rows("matches")
    .filter((m) => m.tournamentId === tournamentID)
    .map((m) => {
      const matchParts = parts.get(m.id) ?? [];
      // Parts won, or the points if the match was a single game.
      const single = matchParts.length === 1 ? matchParts[0] : null;
      return {
        id: m.id,
        sport: m.sport,
        state: m.state,
        us: side(m.usPlayer1Id, m.usPlayer2Id),
        them: side(m.themPlayer1Id, m.themPlayer2Id),
        usScore: Number(single?.us ?? m.us ?? 0),
        themScore: Number(single?.them ?? m.them ?? 0),
        gamesUs: Number(m.us ?? 0),
        gamesThem: Number(m.them ?? 0),
        winner: m.winner == null ? null : Number(m.winner),
        parts: matchParts.length > 1 ? matchParts : [],
        date: parseDate(m.endDate) ?? parseDate(m.startDate),
        lastActivity: m.modified ?? parseDate(m.startDate),
      };
    });

  const finished = matches
    .filter((m) => m.state === "finished")
    .sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
  const live = matches
    .filter((m) => m.state === "active" && m.lastActivity && now - m.lastActivity < inactivityLimit)
    .sort((a, b) => (b.lastActivity ?? 0) - (a.lastActivity ?? 0));

  return {
    id: tournamentID,
    title: info.title ?? "",
    sport: info.sport,
    hasRoster: roster.size > 0,
    rankings: rankings(finished, grouping === "team" ? "team" : "player", roster, player),
    results: finished,
    live,
  };
}

/**
 * As `RankingsFetchRequest`: wins and losses of the finished matches, per player (the roster's active
 * players at zero before they played) or per team, by win percentage, then name.
 */
function rankings(matches, grouping, roster, player) {
  const totals = new Map();
  const entry = (ids) => {
    const key = ids.join("+");
    if (!totals.has(key)) totals.set(key, { ids, wins: 0, losses: 0 });
    return totals.get(key);
  };
  for (const match of matches) {
    for (const [players, won] of [[match.us, match.winner === 0], [match.them, match.winner === 1]]) {
      const ids = players.map((p) => p.id);
      const entries = grouping === "team" ? [entry([...ids].sort())] : ids.map((id) => entry([id]));
      for (const e of entries) won ? e.wins++ : e.losses++;
    }
  }
  if (grouping === "player") {
    for (const [id, p] of roster) {
      if (!isTrue(p.isArchived)) entry([id]);
    }
  }
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  return [...totals.values()]
    .map((e) => {
      const players = e.ids.map(player).sort((a, b) => collator.compare(a.name, b.name));
      const played = e.wins + e.losses;
      return {
        players,
        wins: e.wins,
        losses: e.losses,
        percentage: played ? (e.wins * 100) / played : null,
        sortName: players[0]?.name ?? "",
      };
    })
    .sort((a, b) =>
      (b.percentage ?? -1) - (a.percentage ?? -1) || collator.compare(a.sortName, b.sortName));
}
