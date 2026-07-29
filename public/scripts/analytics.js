/**
 * Seeing Single-Cell — Client-side analytics tracker
 *
 * How it works:
 *   1. Fetches visitor's public IP → ip-api.com (free, no key)
 *   2. Appends visit record to a JSONBin.io bin
 *   3. JSONBin stores the JSON array of all visits
 *
 * Setup (for repo owner):
 *   1. Create a free account at https://www.jsonbin.io
 *   2. Create a new bin → type: JSON array → make it public (read)
 *   3. In GitHub → Settings → Secrets → Actions, add:
 *      - ANALYTICS_BIN_ID    = your bin id
 *      - ANALYTICS_BIN_KEY   = your JSONBin API key
 *
 * The deploy workflow injects these values into the final HTML.
 *
 * This file is the TEMPLATE. After deploy, the CI replaces the placeholders.
 */

const ANALYTICS = {
  BIN_ID: '__ANALYTICS_BIN_ID__',
  BIN_KEY: '__ANALYTICS_BIN_KEY__',
  STATS_URL: '/data/analytics-stats.json',
};

// Only track if the bin is configured (real values injected by CI)
const IS_CONFIGURED =
  ANALYTICS.BIN_ID !== '__ANALYTICS_BIN_ID__' &&
  ANALYTICS.BIN_ID.length > 5;

if (!IS_CONFIGURED || typeof window === 'undefined') {
  if (typeof window !== 'undefined') {
    console.info('[analytics] not configured — skipping tracking');
  }
} else {
  (function () {
    const STORAGE_KEY = '__ss_analytics_last_visit__';
    const RETRY_DELAY_MS = 1000;
    const MAX_RETRIES = 3;

    // Only track once every 60 minutes per browser
    function shouldTrack() {
      try {
        const last = localStorage.getItem(STORAGE_KEY);
        if (last && Date.now() - parseInt(last, 10) < 60 * 60 * 1000) {
          return false;
        }
        return true;
      } catch {
        return true;
      }
    }

    async function ipInfo() {
      try {
        const r = await fetch(
          'https://ip-api.com/json/?fields=status,continentCode,country,countryCode,regionName,city,lat,lon,query,isp,org,as'
        );
        const j = await r.json();
        if (j.status === 'success') {
          return {
            continent: j.continentCode,
            country: j.country,
            countryCode: j.countryCode,
            region: j.regionName,
            city: j.city,
            lat: j.lat,
            lon: j.lon,
            ip: j.query,
            isp: j.isp,
            org: j.org,
          };
        }
      } catch {
        /* silent — privacy-friendly fallback */
      }
      return null;
    }

    function record(geo) {
      return {
        ts: new Date().toISOString(),
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer || null,
        country: geo ? geo.country : null,
        countryCode: geo ? geo.countryCode : null,
        region: geo ? geo.region : null,
        city: geo ? geo.city : null,
        lat: geo ? geo.lat : null,
        lon: geo ? geo.lon : null,
        ip: geo ? geo.ip : null,
        isp: geo ? geo.isp : null,
        org: geo ? geo.org : null,
        ua: navigator.userAgent,
        lang: navigator.language,
      };
    }

    async function putBin(payload, retry = 0) {
      try {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${ANALYTICS.BIN_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': ANALYTICS.BIN_KEY,
          },
          body: JSON.stringify({ record: payload }),
        });
        if (r.status >= 200 && r.status < 300) return true;
        if (r.status === 429 && retry < MAX_RETRIES) {
          await new Promise((p) => setTimeout(p, RETRY_DELAY_MS * (retry + 1)));
          return putBin(payload, retry + 1);
        }
        return false;
      } catch {
        if (retry < MAX_RETRIES) {
          await new Promise((p) => setTimeout(p, RETRY_DELAY_MS * (retry + 1)));
          return putBin(payload, retry + 1);
        }
        return false;
      }
    }

    async function appendVisit() {
      if (!shouldTrack()) return;

      let visits = [];
      const BIN = `https://api.jsonbin.io/v3/b/${ANALYTICS.BIN_ID}/record`;

      // Read current
      try {
        const r = await fetch(BIN, {
          headers: { 'X-Master-Key': ANALYTICS.BIN_KEY },
        });
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j.record)) visits = j.record;
        }
      } catch {
        /* start fresh */
      }

      // Add new visit
      const geo = await ipInfo();
      visits.push(record(geo));

      // Deduplicate: remove records older than 90 days
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      visits = visits.filter(
        (v) => new Date(v.ts).getTime() > cutoff
      );

      await putBin(visits);

      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }

    // Track on page load, don't block rendering
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(appendVisit);
    } else {
      setTimeout(appendVisit, 1000);
    }

    // Track click interactions
    document.addEventListener(
      'click',
      (e) => {
        if (!shouldTrack()) return;
        let target = e.target;
        while (target && target !== document) {
          if (
            target.tagName === 'A' &&
            target.getAttribute('href') &&
            target.getAttribute('href').startsWith('/')
          ) {
            setTimeout(() => {
              fetch('https://api.jsonbin.io/v3/b/' + ANALYTICS.BIN_ID + '/record', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Master-Key': ANALYTICS.BIN_KEY,
                },
                body: JSON.stringify({
                  record: {
                    ts: new Date().toISOString(),
                    type: 'click',
                    url: window.location.href,
                    path: window.location.pathname,
                    target: target.getAttribute('href'),
                    text: (target.textContent || '').slice(0, 100),
                    referrer: document.referrer || null,
                    ua: navigator.userAgent,
                    lang: navigator.language,
                  },
                }),
              }).catch(() => {});
            }, 50);
            break;
          }
          target = target.parentNode;
        }
      },
      true
    );
  })();
}
