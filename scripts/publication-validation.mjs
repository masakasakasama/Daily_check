const key = article => article.eventKey || article.id;
const articles = day => [...(day.alerts || []), ...(day.references || [])];
const fail = message => { throw new Error(message); };

// A changelog is a rolling list of independent releases, not a single article.
const rollingSources = new Set([
  'learn.chatgpt.com/docs/changelog',
  'code.claude.com/docs/en/changelog',
  'openai.com/products/release-notes',
]);
export function sourceIdentity(source) {
  try {
    const url = new URL(source?.url);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let path = url.pathname.replace(/\/+$/, '') || '/';
    // Help Center article slugs change; the numeric ID identifies the document.
    const help = host === 'help.openai.com' && path.match(/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?articles\/(\d+)/i);
    if (help) return `${host}/articles/${help[1]}`;
    const base = `${host}${path}`;
    if (rollingSources.has(base)) return null;
    for (const param of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|fbclid$|gclid$)/i.test(param)) url.searchParams.delete(param);
    }
    url.searchParams.sort();
    return base + (url.searchParams.size ? `?${url.searchParams}` : '');
  } catch { return null; }
}

export function validateDailyPublication(day, previousDays = []) {
  const earlier = previousDays.filter(d => d.date < day.date).flatMap(articles);
  const previous = new Set(earlier.map(key));
  const previousSources = new Map(earlier.map(a => [sourceIdentity(a.source), a]).filter(([url]) => url));
  const seen = new Set();
  const seenSources = new Set();
  for (const article of articles(day)) {
    if (!key(article)) fail(`${day.date}: article identity missing`);
    if (article.discoveredLate === true) {
      const recovery = day.recovery;
      const evidence = recovery?.articles?.find(item => item.eventKey === key(article));
      // Explicit reconstruction of a missed day keeps the true discovery time.
      const publishedDate = String(article.publishedAt || '').replaceAll('/', '-');
      if (recovery?.mode !== 'verified-historical-recovery'
        || recovery.completed !== true || publishedDate !== day.date
        || evidence?.verified !== true || evidence.sourceUrl !== article.source?.url
        || !Number.isFinite(Date.parse(recovery.completedAt))
        || !Number.isFinite(Date.parse(article.firstSeenAt))
        || Date.parse(article.firstSeenAt) > Date.parse(recovery.completedAt)) {
        fail(`${day.date}: discoveredLate leaked into daily feed: ${key(article)}`);
      }
    }
    if (previous.has(key(article))) fail(`${day.date}: previously published eventKey: ${key(article)}`);
    if (seen.has(key(article))) fail(`${day.date}: duplicate eventKey: ${key(article)}`);
    seen.add(key(article));
    const identity = sourceIdentity(article.source);
    if (identity && seenSources.has(identity)) fail(`${day.date}: duplicate article source: ${identity}`);
    const earlierArticle = identity && previousSources.get(identity);
    if (earlierArticle) {
      const revision = article.sourceUpdate;
      const meaningfulRevision = revision?.previousEventKey === key(earlierArticle)
        && typeof revision.changeSummary === 'string' && revision.changeSummary.trim().length >= 20
        && /^https:\/\//.test(revision.evidenceUrl || '') && Number.isFinite(Date.parse(revision.verifiedAt));
      if (!meaningfulRevision) fail(`${day.date}: previously published article source: ${identity}`);
    }
    if (identity) seenSources.add(identity);
  }
}
export function validateWeeklyUnion(week, days) {
  const end = new Date(`${week.end}T00:00:00Z`);
  if (Number.isNaN(end.valueOf())) fail('Invalid weekly end date');
  const dates = Array.from({length: 7}, (_, i) => new Date(end.valueOf() - (6-i)*86400000).toISOString().slice(0,10));
  if (week.start !== dates[0]) fail('Weekly start is not D-6');
  const window = dates.map(date => {
    const matches = days.filter(day => day.date === date);
    if (matches.length !== 1) fail(`Weekly union requires exactly one day: ${date}`);
    return matches[0];
  });
  for (const [dailyField, weeklyField, countField] of [['alerts','highlights','important'],['references','references','reference']]) {
    if (!Array.isArray(week[weeklyField])) fail(`Weekly ${weeklyField} missing`);
    const expected = new Set(window.flatMap(day => day[dailyField] || []).map(key));
    const actual = week[weeklyField].map(key);
    if (actual.some(k => !k) || new Set(actual).size !== actual.length) fail(`Weekly ${weeklyField} has missing or duplicate identity`);
    const missing = [...expected].filter(k => !actual.includes(k));
    const extra = actual.filter(k => !expected.has(k));
    if (missing.length || extra.length) fail(`Weekly ${weeklyField} differs from daily union: ${missing.length} missing, ${extra.length} extra`);
    if (week.counts?.[countField] !== expected.size) fail(`Weekly ${countField} count differs from daily union`);
  }
}
