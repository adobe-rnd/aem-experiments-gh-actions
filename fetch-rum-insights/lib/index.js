const core = require('@actions/core');
import { fetchBundles } from '../common/rum-bundler-client.js';
import {
  sumPageviews,
  applyFilters,
} from '../common/aggregations.js';


/**
 * Build a context object that contains alls secrets and variables used across the action.
 * @returns a context object with references to the main variables
 */
function getActionContext() {
  const domain = core.getInput('domain', { required: true });
  const url = core.getInput('url', { required: true });
  const days = core.getInput('days');

  return {
    // Secrets
    domainKey: core.getInput('domain-key', { required: true }),
    // Variables
    domain,
    url,
    days,
  };
}

/**
 * The action steps to be executed
 * @returns a promise that the action was executed
 */
async function run() {
  try {
    const context = getActionContext();
    const allChunks = await fetchBundles(context.domain, context.days);
    const urlChunks = applyFilters(allChunks, {url: context.url});
    const eventFilters = {
      checkpoint: 'experiment',
    };
    const experimentChunks = applyFilters(urlChunks, {}, eventFilters);
    const pageViews = sumPageviews(urlChunks);
    const experimentPageViews = sumPageviews(experimentChunks);
    const experimentClickedChunks = applyFilters(experimentChunks, {}, {checkpoint: 'click'});
    const experimentConvertedChunks = applyFilters(experimentChunks, {}, {checkpoint: 'convert'});
    const clickedPageViews = sumPageviews(experimentClickedChunks);
    const convertedPageViews = sumPageviews(experimentConvertedChunks);
    console.log(pageViews + ' page views on ' + EXPERIMENT_URL + ' from ' + START_DATE);
    console.log(' - ' + experimentPageViews+ ' reporting experiment checkpoint, of which:');
    console.log('   - ' + clickedPageViews + ' clicks anywhere on the page');
    console.log('   - ' + convertedPageViews + ' conversions');
    const experimentInsights = {
      pageViews,
      experimentPageViews,
      clickedPageViews,
      convertedPageViews,
    };
    return experimentInsights;
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
