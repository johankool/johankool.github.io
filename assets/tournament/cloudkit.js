// CloudKit's web API, the one behind Apple's CKTool JS (api.icloud.apple.com/v1/database/…).
//
// The apps sync with SQLiteData, which keeps every field in a record's encrypted values. The classic
// CloudKit JS and Web Services can't read those; this API can, with the container's API token and the
// signed-in user's web auth token. CKTool JS itself isn't used: its decoder rejects these responses.

const SERVER = "https://api.icloud.apple.com";

export class CloudKitError extends Error {
  constructor(status, body) {
    super(`${status} ${body?.message ?? ""}${body?.reason ? `: ${body.reason}` : ""}`);
    this.name = "CloudKitError";
    this.status = status;
    this.body = body;
  }

  /** Whether signing in (again) helps: no or an expired web auth token. */
  get needsSignIn() {
    return this.status === 421 || this.status === 401;
  }
}

export class SignInError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "SignInError";
    this.reason = reason;
  }
}

export class CloudKit {
  constructor({ container, environment, apiToken }) {
    this.container = container;
    this.environment = environment;
    this.apiToken = apiToken;
    this.storageKey = `cloudKitWebAuthToken:${container}:${environment}`;
    try {
      this.webAuthToken = localStorage.getItem(this.storageKey);
    } catch {
      this.webAuthToken = null;
    }
  }

  get isSignedIn() {
    return Boolean(this.webAuthToken);
  }

  /** Keeps the token in this browser, so the next visit doesn't ask again while it's valid. */
  setWebAuthToken(token) {
    this.webAuthToken = token;
    try {
      if (token) localStorage.setItem(this.storageKey, token);
      else localStorage.removeItem(this.storageKey);
    } catch {
      // Private browsing: signed in for this visit only.
    }
  }

  signOut() {
    this.setWebAuthToken(null);
  }

  async request(method, path, { body, signedIn = true } = {}) {
    const headers = { "X-Apple-CloudKit-API-Token": this.apiToken };
    if (signedIn && this.webAuthToken) headers["X-Apple-CloudKit-Web-Auth-Token"] = this.webAuthToken;
    if (body) headers["Content-Type"] = "application/json";
    const url = `${SERVER}/v1/database/containers/${encodeURIComponent(this.container)}`
      + `/environments/${this.environment}${path}`;
    const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await response.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { message: text.slice(0, 200) };
    }
    if (!response.ok) throw new CloudKitError(response.status, json);
    return json;
  }

  /**
   * Signs in with an Apple ID in a popup. Call it from a click: the popup opens right away, so the
   * browser doesn't block it, and goes to Apple's sign-in once CloudKit gave its URL. Apple's page then
   * posts the token (`ckSession`, as CloudKit JS reads it) from cdn.apple-cloudkit.com.
   */
  async signIn() {
    const popup = window.open("", "cloudKitSignIn", "width=540,height=680");
    if (!popup) throw new SignInError("popupBlocked");
    try {
      let url;
      try {
        await this.request("GET", "/session/user", { signedIn: false });
      } catch (error) {
        url = error?.body?.redirectUrl ?? error?.body?.redirectURL;
        if (!url) throw error;
      }
      if (!url) throw new SignInError("noSignInURL");
      popup.location.href = url;
      const token = await waitForToken(popup);
      this.setWebAuthToken(token);
    } catch (error) {
      popup.close();
      throw error;
    }
  }

  /** The signed-in user's record name, which tells Apple IDs apart. */
  async currentUser() {
    const response = await this.request("GET", "/session/user");
    return response.user?.userRecordName ?? null;
  }

  /** The share behind a link, with its root record and how the signed-in user takes part in it. */
  async resolveShare(shortGuid, requestedFields) {
    const response = await this.request("POST", `/sharedRecords/${encodeURIComponent(shortGuid)}/resolve`, {
      body: { shouldFetchRootRecord: true, requestedFields },
    });
    return response.record;
  }

  /** Joins a share: the user becomes a participant and the zone shows in their shared database. */
  async acceptShare(shortGuid) {
    const response = await this.request("POST", `/sharedRecords/${encodeURIComponent(shortGuid)}/accept`, {
      body: { shouldFetchRootRecord: false },
    });
    return response.record;
  }

  async zones(databaseType) {
    const zones = [];
    let continuationToken;
    do {
      const query = continuationToken ? `?continuationToken=${encodeURIComponent(continuationToken)}` : "";
      const response = await this.request("GET", `/databases/${databaseType}/zones${query}`);
      zones.push(...(response.zones ?? []));
      continuationToken = response.continuationToken;
    } while (continuationToken);
    return zones;
  }

  /**
   * The zone's changes since `changeToken` (everything without one), limited to the given record types
   * and fields, in batches of 200 (the most CloudKit returns at once). `onBatch` gets each batch's
   * record results (`existing` or `deleted`) as it arrives, and whether more are coming. Returns all
   * of them and the token to continue from.
   */
  async changes(databaseType, zoneName, { changeToken, recordTypes, fields, onBatch } = {}) {
    const results = [];
    let token = changeToken;
    let moreComing;
    do {
      const response = await this.request(
        "POST",
        `/databases/${databaseType}/zones/${encodeURIComponent(zoneName)}/changes`,
        {
          body: {
            resultsLimit: 200,
            ...(token ? { changeToken: token } : {}),
            ...(recordTypes ? { requestedRecordTypes: recordTypes } : {}),
            ...(fields ? { requestedFields: fields } : {}),
          },
        },
      );
      const batch = response.recordResults ?? [];
      results.push(...batch);
      token = response.changeToken ?? token;
      moreComing = response.moreComing;
      onBatch?.(batch, { moreComing, count: results.length });
    } while (moreComing);
    return { results, changeToken: token };
  }
}

function waitForToken(popup) {
  return new Promise((resolve, reject) => {
    const done = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(closedCheck);
    };
    const onMessage = (event) => {
      let host;
      try {
        host = new URL(event.origin).hostname;
      } catch {
        return;
      }
      if (!/(^|\.)(apple\.com|icloud\.com|apple-cloudkit\.com)$/.test(host)) return;
      const token = event.data?.ckSession ?? event.data?.ckWebAuthToken;
      if (typeof token === "string" && token) {
        done();
        resolve(token);
      } else if (event.data?.errorMessage) {
        done();
        reject(new SignInError(String(event.data.errorMessage)));
      }
    };
    // Closing the popup without signing in.
    const closedCheck = setInterval(() => {
      if (popup.closed) {
        done();
        reject(new SignInError("cancelled"));
      }
    }, 500);
    window.addEventListener("message", onMessage);
  });
}
