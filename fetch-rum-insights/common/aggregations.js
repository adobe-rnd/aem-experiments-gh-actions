function calculateSessionDurationP50(chunks) {
  const leaveTimes = chunks.flatMap((chunk) => chunk.events)
    .filter((event => event.checkpoint === 'leave'))
    .map((event) => event.timeDelta);

  if (leaveTimes.length === 0) return null;
  leaveTimes.sort((a, b) => a - b);
  const mid = Math.floor(leaveTimes.length / 2);
  return leaveTimes.length % 2 !== 0 ? leaveTimes[mid] : (leaveTimes[mid - 1] + leaveTimes[mid]) / 2;
}

function collectSources(chunks) {
  return chunks.reduce((acc, cur) => {
    const entry = cur.events.find((event) => event.checkpoint === 'enter');
    if (!entry) return acc;

    const source = entry.source.toLowerCase();
    acc[source] = (acc[source] || 0) + cur.weight;
    return acc;
  }, {})
}

function collectUTMByType(chunks, utmType) {
  return chunks.reduce((acc, cur) => {
    const entry = cur.events.find((event) => event.checkpoint === 'utm' && event.source === utmType);
    if (!entry) return acc;

    const target = entry.target.toLowerCase();
    acc[target] = (acc[target] || 0) + cur.weight;
    return acc;
  }, {})
}

function groupChunksByUrl(chunks, pageviewThreshold) {
  const all = chunks.reduce((acc, cur) => {
    if (!acc[cur.url]) {
      acc[cur.url] = {
        pageview: 0,
        chunks: [],
      };
    }
    acc[cur.url].pageview += cur.weight;
    acc[cur.url].chunks.push(cur);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(all)
      .filter(([_, value]) => value.pageview > pageviewThreshold)
  );
}

function getVisitsCount(chunks) {
  return chunks.reduce((acc, cur) => {
    const entry = cur.events.find((event) => event.checkpoint === 'enter');
    if (!entry) return acc;
    acc += cur.weight;
    return acc;
  }, 0);
}

function sliceChunksWithInDates(chunks, startDate, endDate) {
  const today = new Date();
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(today.getDate() - 30);
  const defaultEndDate = today;
  startDate = startDate || defaultStartDate;
  endDate = endDate || defaultEndDate;
  return chunks.filter((chunk) => {
    const chunkDate = new Date(chunk.time);
    return chunkDate >= startDate && chunkDate <= endDate;
  });
}

function sliceChunksWithNoClick(chunks) {
  return chunks.filter((chunk) => !chunk.events.find((event) => event.checkpoint === 'click'));
}

function getCheckpointsCount(chunks) {
  const checkpoints = {};
  chunks.flatMap((chunk) => chunk.events)
    .forEach((event) => {
      if (checkpoints[event.checkpoint] == undefined) {
        checkpoints[event.checkpoint] = 0;
      } else {
        checkpoints[event.checkpoint] += 1;
      }
    });
  return checkpoints;
}

function slicePaidTraffic(chunks) {
  return chunks.filter((chunk) => chunk.events.some((event) => event.checkpoint === 'utm'));
}

function sliceOrganicTraffic(chunks) {
  return chunks.filter((chunk) => !chunk.events.find((event) => event.checkpoint === 'utm'));
}

function sumPageviews(chunks) {
  return chunks.reduce((acc, cur) => {
    acc += cur.weight;
    return acc;
  }, 0);
}
/**
 * Filters the chunks based on the chunkFilters and eventFilters
 * @param {*} chunks
 * @param {*} chunkFilters filters that user the properties on the chunk itself like weight, url, etc.
 *                          Can be an array for multiple values, will look for at least one value to match.
 * @param {*} eventFilters filters that use the properties on the events like checkpoint, source, etc.
 *                          Can be an array for multiple values, will look for at least one value to match.
 * @returns
 */
function applyFilters(chunks, chunkFilters, eventFilters) {
  return chunks.filter((chunk) => {
    for (const key in chunkFilters) {
      if (Array.isArray(chunkFilters[key])) {
        if (!chunkFilters[key].some((value) => chunk[key] == value)) return false;
      } else if (chunk[key] !== chunkFilters[key]) return false;
    }
    if (eventFilters) {
      const filteredEvents = chunk.events.find((event) => {
        for (const key in eventFilters) {
          if (Array.isArray(chunkFilters[key])) {
            if (!eventFilters[key].some((value) => event[key] == value)) return false;
          } else if (event[key] !== eventFilters[key]) return false;
        }
        return true;
      });
      if (!filteredEvents) return false;
    }
    return true;
  });
}

export {
  calculateSessionDurationP50,
  collectUTMByType,
  collectSources,
  groupChunksByUrl,
  sliceChunksWithNoClick,
  slicePaidTraffic,
  sliceOrganicTraffic,
  sumPageviews,
  getCheckpointsCount,
  getVisitsCount,
  sliceChunksWithInDates,
  applyFilters,
}
