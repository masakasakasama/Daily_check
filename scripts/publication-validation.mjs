const key = article => article.eventKey || article.id;
const articles = day => [...(day.alerts || []), ...(day.references || [])];
const fail = message => { throw new Error(message); };
export function validateDailyPublication(day, previousDays = []) {
  const previous = new Set(previousDays.filter(d => d.date < day.date).flatMap(articles).map(key));
  const seen = new Set();
  for (const article of articles(day)) {
    if (!key(article)) fail(`${day.date}: article identity missing`);
    if (article.discoveredLate === true) fail(`${day.date}: discoveredLate leaked into daily feed: ${key(article)}`);
    if (previous.has(key(article))) fail(`${day.date}: previously published eventKey: ${key(article)}`);
    if (seen.has(key(article))) fail(`${day.date}: duplicate eventKey: ${key(article)}`);
    seen.add(key(article));
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
