async function fetchBundles(domain, interval, domainKey) {
  const HOURS = 24;
  const chunks = [];
  const today = new Date();

  for (let i = 0; i < interval; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    for (let hour = 0; hour < HOURS; hour++) {
      const url = `https://rum.fastly-aem.page/bundles/${domain}/${year}/${month}/${day}/${hour}?domainkey=${domainKey}`;
      const responseJson = await fetch(url).then(response => response.json());
      chunks.push(responseJson);
    }
  }

  return chunks.flatMap((chunk) => chunk.rumBundles);
}

async function fetchLastMonth(domain) {
  return fetchBundles(domain,31);
}

export {
  fetchLastMonth,
  fetchBundles,
}
