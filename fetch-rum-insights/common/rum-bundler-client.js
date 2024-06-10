async function fetchBundles(domain, interval, domainKey, checkpoints) {
  const BATCH_SIZE = 10;
  const HOURS = 24;
  const chunks = [];
  const urls = [];

  const today = new Date();

  for (let i = 0; i < interval; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    for (let hour = 0; hour < HOURS; hour++) {
      urls.push(`https://rum.fastly-aem.page/bundles/${domain}/${year}/${month}/${day}/${hour}?domainkey=${domainKey}`);
    }
  }
  for (let start = 0; start < urls.length; start += BATCH_SIZE) {
    const batch = urls.slice(start, start + BATCH_SIZE);
    const promises = [];
    let error = false;
    let batchBundles = [];
    try {
      for (const url of batch) {
        promises.push(fetch(url));
      }
      const responses = await Promise.all(promises);
      batchBundles = await Promise.all(responses.map((response) => response.json()));
    } catch (e) {
      error = true;
      console.error('error while fetching RUM bundles..',  e);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.info("retrying the batch");
      start -= BATCH_SIZE;
    }
    if (!error) {
      if(checkpoints) {
        for (const bundle of batchBundles) {
          // filter the events inside the bundle.rumBundles based on the checkpoints and return the updated rumBundles
          bundle.rumBundles = bundle.rumBundles.map((rumBundle) => {
            rumBundle.events = rumBundle.events.filter((event) => checkpoints.includes(event.checkpoint));
            return rumBundle;
          });
        }
      }
      chunks.push(...batchBundles);
    }
  }
  return chunks.flatMap((chunk) => chunk.rumBundles);
}

async function fetchLastMonth(domain, domainKey, checkpoints) {
  return fetchBundles(domain, 30, domainKey, checkpoints);
}

export {
  fetchLastMonth,
  fetchBundles,
}
