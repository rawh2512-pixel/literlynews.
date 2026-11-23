const USER = process.env.USER_GITHUB || 'RakzVolt';
const TOKEN = process.env.TOKEN_GITHUB || '';

const baseHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'literly-news-profile'
};
if (TOKEN) baseHeaders.Authorization = 'Bearer ' + TOKEN;

async function getJson(url, init) {
  const r = await fetch(url, init || { headers: baseHeaders });
  if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
  return r.json();
}

const LEVELS = {
  NONE: 0, 
  FIRST_QUARTILE: 1, 
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4
};

async function calendarGraphQL() {
  const query = 'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount contributionLevel}}}}}}';
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: Object.assign({}, baseHeaders, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query, variables: { login: USER } })
  });
  if (!r.ok) throw new Error('graphql HTTP ' + r.status);
  const j = await r.json();
  const weeks = j.data.user.contributionsCollection.contributionCalendar.weeks;
  const out = [];
  weeks.forEach(function (w) {
    w.contributionDays.forEach(function (d) {
      out.push([d.date, d.contributionCount, LEVELS[d.contributionLevel] || 0]);
    });
  });
  return out;
}

async function calendarPublic() {
  const j = await getJson('https://github-contributions-api.jogruber.de/v4/' + USER + '?y=last', { headers: { Accept: 'application/json' } });
  return j.contributions.map(function (c) { return [c.date, c.count, c.level]; });
}

async function calendar() {
  if (TOKEN) {
    try { return await calendarGraphQL(); } catch (e) { /* lanjut ke sumber publik */ }
  }
  try { return await calendarPublic(); } catch (e) { return null; }
}

async function build() {
  const [user, repos, days] = await Promise.all([
    getJson('https://api.github.com/users/' + USER),
    getJson('https://api.github.com/users/' + USER + '/repos?per_page=100&type=owner&sort=pushed'),
    calendar()
  ]);
  const own = repos.filter(function (x) { return !x.fork; }).slice(0, 25);
  const langs = await Promise.all(own.map(function (x) {
    return getJson(x.languages_url).catch(function () { return {}; });
  }));
  const byName = {};
  own.forEach(function (x, i) { byName[x.name] = langs[i]; });
  return {
    t: Date.now(),
    user: { followers: user.followers, repos: user.public_repos },
    repos: repos.map(function (x) {
      return { name: x.name, fork: !!x.fork, stars: x.stargazers_count, desc: x.description, lang: x.language, langs: byName[x.name] || null };
    }),
    days: days
  };
}

module.exports = async function handler(req, res) {
  try {
    const data = await build();
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(data));
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    res.status(502).json({ error: 'upstream_failed' });
  }
};
