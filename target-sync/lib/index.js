const { mkdir, writeFile } = require('fs').promises;
const { Base64 } = require('js-base64');
const { JSDOM } = require('jsdom');
const { dirname } = require('path');
const core = require('@actions/core');
const github = require('@actions/github');
const http = require('@actions/http-client');
const { context: imsContext, getToken } = require('@adobe/aio-lib-ims');

const BOT_NAME = 'aem-experimentation-target-sync';

const client = new http.HttpClient(BOT_NAME);

/**
 * Build a context object that contains alls secrets and variables used across the action.
 * @returns a context object with references to the main variables
 */
function getActionContext() {
  const git_repo = core.getInput('git_repo', { required: true });
  const [owner, repo] = git_repo.split('/');
  const ref = core.getInput('git_ref');
  return {
    // Secrets
    clientId: core.getInput('aio_console_client_id', { required: true }),
    clientSecret: core.getInput('aio_console_client_secret', { required: true }),
    imsOrgId: core.getInput('aio_console_ims_org_id', { required: true }),
    technicalAccountEmail: core.getInput('aio_console_technical_account_email', { required: true }),
    technicalAccountId: core.getInput('aio_console_technical_account_id', { required: true }),
    gitToken: core.getInput('git_pat_token', { required: true }),
    targetTenant: core.getInput('target_tenant', { required: true }),
    // Variables
    owner,
    repo,
    ref,
    pagePath: core.getInput('resource_path', { required: true }),
    prodHost: core.getInput('prod_host') || `https://${ref}--${repo}--${owner}.hlx.live`,
  };
}

/**
 * Get the manifest path for the page that triggered the action.
 * @param {object} context The action context object
 * @param {string} context.pagePath The path to the current page
 * @param {string} root The root path in the repo that contains the manifests
 * @returns a string representing the path to the manifest in the Git repo
 */
function getManifestPathInRepo(context, root) {
  const manifestPath = `${root.replace(/^\//, '')}${`${context.pagePath.replace(/\.md$/, '')}`}.manifest.json`;
  console.debug('Manifest path:', manifestPath);
  return manifestPath;
}

/**
 * Get the experiment id from the current live page if the page has it and also specified the
 * Target engine for the experiment.
 * @param {object} context The action context object
 * @param {string} context.pagePath The path to the current page
 * @param {string} context.prodHost The production host
 * @returns the experiment id in the published page or null if missing
 */
async function getExperimentIdFromDocument(context) {
  const pathname = context.pagePath.replace(/index.md$/, '').replace(/\.md$/, '');
  const url = `${context.prodHost}${pathname}`;
  const response = await client.get(url);
  console.log(11, url, response.message.statusCode);
    
  // If the page does not exist, we return null
  if (response.message.statusCode === 404) {
    return null;
  }

  const htmlString = await response.readBody();
  const dom = new JSDOM(htmlString);

  // If the experiment is not using the Target engine, we return null
  const engine = dom.window.document.querySelector('head>meta[name="experiment-engine"]')?.content.toLowerCase().trim();
  console.log(12, engine);
  if (engine !== 'target') {
    return null;
  }

  // Return the experiment id from the metadata
  const experimentId = dom.window.document.querySelector('head>meta[name="experiment"]')?.content.trim();
  console.debug('Experiment id:', experimentId);
  return experimentId || '';
}

/**
 * Get the existing manifest if it exists in the repo
 * @param {object} context The action context object
 * @param {string} context.owner The owner/org for the git repo
 * @param {string} context.repo The git repo name
 * @param {string} context.ref The branch for the git repo
 * @param {object} context.octokit A reference to the octokit client
 * @param {string} manifestPath The path to the manifest in the git repo 
 * @returns an object representing the manifest, or null if it does not exist in the git repo
 */
async function getExistingManifestFromRepo(context, manifestPath) {
  const { owner, repo, ref, octokit } = context;
  try {
    const result = await octokit.rest.repos.getContent({owner, repo, ref, path: manifestPath });
    return result.data;
  } catch (err) {
    return null;
  }
}

/**
 * Delete the specified manifest from the git repo
 * @param {object} context The action context object
 * @param {string} context.owner The owner/org for the git repo
 * @param {string} context.repo The git repo name
 * @param {string} context.ref The branch for the git repo
 * @param {object} context.octokit A reference to the octokit client
 * @param {object} manifest An object representing the manifest to be deleted
 * @param {string} manifest.path The path to the manifest in the git repo
 * @param {string} manifest.sha The SHA hash for the manifest in the git repo
 * @param {string} experimentId The id for the experiment
 * @returns a promise that the file was deleted from the repo
 */
async function deleteManifestFromRepo(context, manifest, experimentId) {
  const { owner, repo, ref, octokit } = context;
  console.debug('Deleting stray manifest for experiment:', experimentId);
  return octokit.rest.repos.deleteFile({
    owner,
    repo,
    branch: ref,
    path: manifest.path,
    sha: manifest.sha,
    message: `chore: delete manifest for removed Target experiment ${experimentId}`,
  });
}

/**
 * Gets a valid access token from IMS so we can connect to the desired Adobe backend.
 * @param {object} context The action context object
 * @param {string} context.clientId The client id from the developer console
 * @param {string} context.clientSecret The client secret from the developer console
 * @param {string} context.technicalAccountEmail The tech. account email from the developer console
 * @param {string} context.technicalAccountId The tech. account id from the developer console
 * @param {string} context.imsOrgId The IMS Org Id from the developer console
 * @returns an acces token that can be used with the desired Adobe backend
 */
async function getImsAccessToken(context) {
  await imsContext.set(BOT_NAME, {
    client_id: context.clientId,
    client_secrets: [context.clientSecret],
    technical_account_email: context.technicalAccountEmail,
    technical_account_id: context.technicalAccountId,
    ims_org_id: context.imsOrgId,
    scopes: ['openid', 'AdobeID', 'target_sdk', 'additional_info.projectedProductContext', 'read_organizations', 'additional_info.roles'],
  });
  try {
    const token = await getToken(BOT_NAME);
    return token;
  } catch (err) {
    console.error('Invalid IMS credentials', context.clientId, err.message);
  }
}

/**
 * Gets the experiment config from Target
 * @param {object} context The action context object
 * @param {string} context.imsOrgId The IMS Org Id from the developer console
 * @param {*} experimentId The experiment id in Target
 * @param {*} accessToken A valid access token to connect to Target
 * @returns a json object representing the experiment config in Target, or null if it does not exist
 */
async function getExperimentConfigFromTarget(context, experimentId, accessToken) {
  const response = await client.get(
    `https://mc.adobe.io/${context.targetTenant}/target/activities/ab/${experimentId}`,
    {
      'Accept': 'application/vnd.adobe.target.v3+json',
      'Authorization': `Bearer ${accessToken}`,
      'cache-control': 'no-cache',
      'x-api-key': context.clientId,
    }
  );
  if (response.message.statusCode >= 400) {
    console.error('Error fetching Target experiment config', experimentId, await response.readBody());
    return null;
  }
  return response.readBody().then(JSON.parse);
}

/**
 * Converts the Target experiment config to a standard manifest format.
 * @param {object} config The Target experiment to convert
 * @returns a json object representing the standard manifest format
 */
async function convertExperimentConfigToManifest(config) {
  return config;
}

/**
 * Adds the manifest to the git repo, or updates the existing one for taht page.
 * @param {object} context The action context object
 * @param {string} context.owner The owner/org for the git repo
 * @param {string} context.repo The git repo name
 * @param {string} context.ref The branch for the git repo
 * @param {object} context.octokit A reference to the octokit client
 * @param {string} manifestPath The path to the manifest in the git repo 
 * @param {string} sha The SHA hash for the manifest in the git repo
 * @param {object} manifest The manifest to write to the git repo
 * @returns a promise that the manifest was written to the git repo
 */
async function addOrUpdateManifestInRepo(context, manifestPath, sha, manifest) {
  const { owner, repo, ref, octokit } = context;
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest));

  if (sha) {
    console.debug('Updating manifest for experiment:', manifest.id);
  } else {
    console.debug('Creating manifest for experiment:', manifest.id);
  }

  const content = Base64.encode(JSON.stringify(manifest));
  return octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    branch: ref,
    path: manifestPath,
    message: `chore: update Target experiment manifest cache for ${manifest.id}`,
    content,
    sha: sha || undefined,
  });
}

/**
 * The action steps to be executed
 * @returns a promise that the action was executed
 */
async function run() {
  try {
    const context = getActionContext();
    context.octokit = github.getOctokit(context.gitToken);

    const manifestPath = getManifestPathInRepo(context, 'experiments');
    const oldManifest = await getExistingManifestFromRepo(context, manifestPath);
    const experimentId = await getExperimentIdFromDocument(context);
    console.log(1, experimentId);
    if (experimentId === null) {
      return;
    }

    console.log(2, oldManifest);
    // Clean up stray manifests if the page was unpublished or the metadata removed
    if (!experimentId && oldManifest?.sha) {
      await deleteManifestFromRepo(context, oldManifest, experimentId);
      return;
    }

    // Get the IMS access token
    const accessToken = await getImsAccessToken(context);
    console.log(3, accessToken);
    if (!accessToken) {
      return;
    }

    // Fetch the Target manifest
    const config = await getExperimentConfigFromTarget(context, experimentId, accessToken);
    console.log(4, config);
    if (!config) {
      return;
    }

    // Check if the manifest has changed
    const manifest = await convertExperimentConfigToManifest(config);
    if (oldManifest?.content.replace(/\n/g, '') === Base64.encode(JSON.stringify(manifest))) {
      console.debug('Manifest is already up-to-date');
      return;
    }

    // Persist the new manifest in the git repo
    await addOrUpdateManifestInRepo(context, manifestPath, oldManifest?.sha, manifest);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
