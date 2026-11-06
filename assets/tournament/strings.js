// The page's texts in the apps' languages: English, Dutch and Indonesian. Texts the apps also show
// (Ranking, Results, Won, …) use the apps' translations.

const strings = {
  en: {
    loading: "Loading…",
    signInTitle: "Sign in to see this tournament",
    signInText: "The tournament is shared through iCloud. Sign in with your Apple ID to see its results. It's only used to read what's shared with you.",
    signIn: "Sign In with Apple ID",
    signingIn: "Signing in…",
    signOut: "Sign Out",
    popupBlocked: "Allow pop-ups for this page to sign in.",
    signInCancelled: "Signing in was cancelled.",
    joinTitle: "Join this tournament to see its results",
    joinText: "Joining adds the tournament to your iCloud, so it also shows in the app if you have it. You can leave it there at any time.",
    join: "Join Tournament",
    noLinkTitle: "This link is incomplete",
    noLinkText: "Open the link you received again, or ask for a new one.",
    notFoundTitle: "This tournament isn't available",
    notFoundText: "It doesn't exist anymore, or it isn't shared with this Apple ID.",
    errorTitle: "Something went wrong",
    errorHint: "If you use Advanced Data Protection, turn on Access iCloud Data on the Web.",
    tryAgain: "Try Again",
    ranking: "Ranking",
    byPlayer: "By Player",
    byTeam: "By Team",
    name: "Name",
    won: "Won",
    lost: "Lost",
    percent: "%",
    results: "Results",
    noMatches: "No matches available (yet)",
    live: "Live",
    playingNow: "Playing now",
    updated: "Updated {time}",
    versus: "{us} versus {them}",
    scoreTo: "{us} to {them}",
    wonBy: "Won by {names}",
    sports: { badminton: "Badminton", padel: "Padel", squash: "Squash", tableTennis: "Table Tennis", tennis: "Tennis" },
  },
  nl: {
    loading: "Laden…",
    signInTitle: "Log in om dit toernooi te zien",
    signInText: "Het toernooi wordt gedeeld via iCloud. Log in met je Apple ID om de uitslagen te zien. Die wordt alleen gebruikt om te lezen wat met jou gedeeld is.",
    signIn: "Log in met Apple ID",
    signingIn: "Inloggen…",
    signOut: "Log uit",
    popupBlocked: "Sta pop-ups toe voor deze pagina om in te loggen.",
    signInCancelled: "Het inloggen is afgebroken.",
    joinTitle: "Doe mee aan dit toernooi om de uitslagen te zien",
    joinText: "Meedoen zet het toernooi in je iCloud, zodat je het ook in de app ziet als je die hebt. Je kunt het daar altijd weer verlaten.",
    join: "Doe mee",
    noLinkTitle: "Deze link is niet compleet",
    noLinkText: "Open de link die je kreeg opnieuw, of vraag om een nieuwe.",
    notFoundTitle: "Dit toernooi is niet beschikbaar",
    notFoundText: "Het bestaat niet meer, of is niet gedeeld met deze Apple ID.",
    errorTitle: "Er ging iets mis",
    errorHint: "Gebruik je geavanceerde databescherming, zet dan ‘Toegang tot iCloud-gegevens via het web’ aan.",
    tryAgain: "Probeer opnieuw",
    ranking: "Stand",
    byPlayer: "per speler",
    byTeam: "per team",
    name: "Naam",
    won: "Winst",
    lost: "Verlies",
    percent: "%",
    results: "Uitslagen",
    noMatches: "Geen uitslagen bekend",
    live: "Live",
    playingNow: "Nu bezig",
    updated: "Bijgewerkt om {time}",
    versus: "{us} tegen {them}",
    scoreTo: "{us} tegen {them}",
    wonBy: "Gewonnen door {names}",
    sports: { badminton: "Badminton", padel: "Padel", squash: "Squash", tableTennis: "Tafeltennis", tennis: "Tennis" },
  },
  id: {
    loading: "Memuat…",
    signInTitle: "Masuk untuk melihat turnamen ini",
    signInText: "Turnamen ini dibagikan melalui iCloud. Masuk dengan Apple ID Anda untuk melihat hasilnya. Apple ID hanya digunakan untuk membaca apa yang dibagikan dengan Anda.",
    signIn: "Masuk dengan Apple ID",
    signingIn: "Sedang masuk…",
    signOut: "Keluar",
    popupBlocked: "Izinkan pop-up untuk halaman ini agar dapat masuk.",
    signInCancelled: "Proses masuk dibatalkan.",
    joinTitle: "Bergabunglah dengan turnamen ini untuk melihat hasilnya",
    joinText: "Bergabung menambahkan turnamen ke iCloud Anda, sehingga juga muncul di aplikasi jika Anda memilikinya. Anda dapat keluar dari turnamen kapan saja di sana.",
    join: "Bergabung",
    noLinkTitle: "Tautan ini tidak lengkap",
    noLinkText: "Buka lagi tautan yang Anda terima, atau minta tautan baru.",
    notFoundTitle: "Turnamen ini tidak tersedia",
    notFoundText: "Turnamen sudah tidak ada, atau tidak dibagikan dengan Apple ID ini.",
    errorTitle: "Terjadi kesalahan",
    errorHint: "Jika Anda menggunakan Perlindungan Data Lanjutan, aktifkan Akses Data iCloud di Web.",
    tryAgain: "Coba Lagi",
    ranking: "Peringkat",
    byPlayer: "Oleh Pemain",
    byTeam: "Oleh Tim",
    name: "Nama",
    won: "Menang",
    lost: "Kalah",
    percent: "%",
    results: "Hasil",
    noMatches: "Belum ada pertandingan yang tersedia",
    live: "Langsung",
    playingNow: "Sedang berlangsung",
    updated: "Diperbarui {time}",
    versus: "{us} lawan {them}",
    scoreTo: "{us} lawan {them}",
    wonBy: "Dimenangkan oleh {names}",
    sports: { badminton: "Bulu Tangkis", padel: "Padel", squash: "Squash", tableTennis: "Tenis Meja", tennis: "Tenis" },
  },
};

/** The first of the browser's languages the page has, English otherwise. */
export const language = (navigator.languages ?? [navigator.language])
  .map((tag) => tag?.toLowerCase().split("-")[0])
  .find((code) => code in strings) ?? "en";

export function t(key, values = {}) {
  const text = strings[language][key] ?? strings.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

/** The sport's name, or its raw value for a sport a newer app version added. */
export function sportName(sport) {
  return strings[language].sports[sport] ?? strings.en.sports[sport] ?? sport ?? "";
}

/** "A and B", in the page's language. */
export function list(names) {
  return new Intl.ListFormat(language, { type: "conjunction" }).format(names);
}
