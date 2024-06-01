const core = require('@actions/core');

async function fetchDomainKey(domain) {
  try {
    const auth = process.env.RUM_BUNDLER_TOKEN;
    const resp = await fetch(`https://rum.fastly-aem.page/domainkey/${domain}`, {
      headers: {
        authorization: `Bearer ${auth}`,
      },
    });
    const json = await resp.json();
    return (json.domainkey);
  } catch {
    return '';
  }
}

async function fetchBundles(domain, interval) {
  const domainKey = await fetchDomainKey(domain)

  const chunks = [];
  const today = new Date();
  core.info(`Fetching ${interval} days of RUM data for ${domain}`);

  for (let i = 0; i < interval; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const url = `https://rum.fastly-aem.page/bundles/${domain}/${year}/${month}/${day}?domainkey=${domainKey}`;
    core.info(`fetching ${url}`);
    const responseJson = await fetch(url)
                            .then(response => response.json());
    chunks.push(responseJson);
  }

  core.info(`Fetched ${chunks.length} chunks`);
  return chunks.flatMap((chunk) => chunk.rumBundles);
}

async function fetchLastMonth(domain) {
  return fetchBundles(domain,31);
}

export {
  fetchLastMonth,
  fetchBundles,
}
