const core = require('@actions/core');
import { fetchBundles } from '../common/rum-bundler-client.js';
import {
  applyFilters,
} from '../common/aggregations.js';
import fs from 'fs';




/**
 * Build a context object that contains alls secrets and variables used across the action.
 * @returns a context object with references to the main variables
 */
function getActionContext() {
  const domain = core.getInput('domain', { required: true });
  const days = core.getInput('days');

  return {
    // Secrets
    domainKey: core.getInput('domain-key', { required: true }),
    // Variables
    domain,
    days,
  };
}

function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

function getOrCreateExperimentObject(urlInsights, experimentName) {
  let experimentObject = urlInsights.find(e => e.experiment === toClassName(experimentName));
    if (!experimentObject) {
      experimentObject = {
        experiment: toClassName(experimentName),
        variants: [],
      };
      urlInsights.push(experimentObject);
    }
  return experimentObject;
}

function getOrCreateVariantObject(variants, variantName) {
  let variantObject = variants.find(v => v.name === variantName);
  if (!variantObject) {
    variantObject = {
      name: variantName,
      views: 0,
      clicks: {},
      conversions: {},
    };
    variants.push(variantObject);
  }
  return variantObject;
}

/**
 * The action steps to be executed
 * @returns a promise that the action was executed
 */
async function run() {
  try {
    const context = getActionContext();
    const experimentInsights = {};
    // const allChunks = await fetchBundles(context.domain, context.days, context.domainKey);
    // const fs = require('fs').promises;
    const path = require('path');

    const filePath = path.join(__dirname, 'xwalk-test.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const allChunks = JSON.parse(fileContent);
    const eventFilters = {
      checkpoint: 'experiment',
    };
    const experimentChunks = applyFilters(allChunks, {}, eventFilters);
    for (let i = 0; i < experimentChunks.length; i++) {
      const chunk = experimentChunks[i];
      const url = chunk.url;
      const views = chunk.weight;
      if (!experimentInsights[url]) {
        experimentInsights[url] = [];
      }
      let experimentEvent = chunk.events.find(e => e.checkpoint === 'experiment');
      if (!experimentEvent) {
        continue;
      }
      const experimentName = experimentEvent.source;
      const variantName = experimentEvent.target;
      let experimentObject = getOrCreateExperimentObject(experimentInsights[url], experimentName);
      let variantObject = getOrCreateVariantObject(experimentObject.variants, variantName);
      variantObject.views += views;

      for (const event of chunk.events) {
        if (event.checkpoint === 'click' ) {
          const clickSource = event.source;
          if (!variantObject.clicks[clickSource]) {
            variantObject.clicks[clickSource] = views;
          } else {
            variantObject.clicks[clickSource] += views;
          }
        } else if (event.checkpoint === 'convert') {
          const convertSource = event.source;
          if (!variantObject.conversions[convertSource]) {
            variantObject.conversions[convertSource] = views;
          } else {
            variantObject.conversions[convertSource] += views;
          }
        }
      }
    }
    core.info(JSON.stringify(experimentInsights, null, 2));
    core.setOutput('data', JSON.stringify(experimentInsights));
    return experimentInsights;
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
