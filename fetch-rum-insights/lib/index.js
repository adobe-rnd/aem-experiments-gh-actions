const core = require('@actions/core');
import { fetchBundles } from '../common/rum-bundler-client.js';
import {
  applyFilters,
} from '../common/aggregations.js';
import fs from 'fs';
import path from 'path';
import rumData from './xwalk-test.json' assert { type: "json" };



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
    core.info('Fetching RUM insights...');

    core.info(JSON.stringify(rumData, null, 2));
    core.setOutput('data', JSON.stringify(rumData));
    return rumData;
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
