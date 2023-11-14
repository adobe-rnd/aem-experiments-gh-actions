const { mkdir, writeFile } = require('fs').promises;
const { JSDOM } = require('jsdom');
const { dirname } = require('path');
const { Base64 } = require('js-base64');
const core = require('@actions/core');
const github = require('@actions/github');
const http = require('@actions/http-client');
const { context: imsContext, getToken, getTokenData } = require('@adobe/aio-lib-ims');

const BOT_NAME = 'aem-experimentation-aep-sync';
const client = new http.HttpClient(BOT_NAME);

async function getExperimentIdFromDocument(domain, path) {
  const url = `${domain}${path.replace(/index.md$/, '').replace(/\.md$/, '')}`;
  const response = await client.get(url);
  const htmlString = await response.readBody();
  const dom = new JSDOM(htmlString);

  const engine = dom.window.document.querySelector('head>meta[name="experiment-engine"]')?.content.toLowerCase().trim();
  if (engine !== 'aep') {
    return null;
  }

  const experimentId = dom.window.document.querySelector('head>meta[name="experiment"]')?.content.trim();
  return experimentId;
}

async function getAccessTokenFromDeveloperConsole(options) {
  await imsContext.set(BOT_NAME, {
    ...options,
    scopes: ['openid', 'AdobeID', 'additional_info.projectedProductContext', 'session'],
  });
  return getToken(BOT_NAME);;
}

async function getExperimentConfigFromAep(experimentId, imsOrgId, token) {
  const response = await client.get(
    `https://platform.adobe.io/data/core/experimentation/experiments/${experimentId}`,
    {
      'Accept': 'application/vnd.adobe.experimentation.v1+json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': 'experimentation-internal',
      'x-gw-ims-org-id': imsOrgId,
      'x-sandbox-name': 'prod',
    }
  );
  return response.readBody().then(JSON.parse);
}

async function convertExperimentConfigToManifest(config) {
  return config;
}

async function addManifestToRepo(owner, repo, ref, path, manifest, token) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(manifest));

  const octokit = github.getOctokit(token);

  let sha;
  try {
    const result = await octokit.rest.repos.getContent({ owner, repo, ref, path });
    sha = result.data.sha;
  } catch (err) {
    // file does not exist yet
    sha = undefined;
  }

  const user = {
    name: BOT_NAME,
    email: '<>',
  };

  const res = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    branch: ref,
    path,
    message: `chore: update AEP experiment manifest cache for ${manifest.id}`,
    content: Base64.encode(JSON.stringify(manifest)),
    committer: user,
    author: user,
    sha,
  });
  return res.data.content.path;
}

async function run() {
  try {
    const client_id = core.getInput('aio_console_client_id', { required: true });
    const client_secret = core.getInput('aio_console_client_secret', { required: true });
    const ims_org_id = core.getInput('aio_console_ims_org_id', { required: true });
    const technical_account_email = core.getInput('aio_console_technical_acccount_email', { required: true });
    const technical_account_id = core.getInput('aio_console_technical_acccount_id', { required: true });
    
    const git_repo = core.getInput('git_repo', { required: true });
    const [owner, repo] = git_repo.split('/');
    const ref = core.getInput('git_ref', { required: true });

    const prodHost = core.getInput('prod_host', { required: false })
      || `https://${ref}--${repo}--${owner}.hlx.live`;

    const pagePath = core.getInput('resource_path', { required: true }); // '/index.md';

    const patToken = core.getInput('git_pat_token', { required: true });

    const experimentId = await getExperimentIdFromDocument(prodHost, pagePath);
    if (!experimentId) {
      return;
    }

    const accessToken = await getAccessTokenFromDeveloperConsole({
      client_id,
      client_secrets: [client_secret],
      technical_account_email,
      technical_account_id,
      ims_org_id,
    });
    const config = await getExperimentConfigFromAep(experimentId, imsOrgId, accessToken);
    const manifest = await convertExperimentConfigToManifest(config);
    const manifestPath = `experiments/${pagePath}/manifest.json`;
    await addManifestToRepo(owner, repo, ref, manifestPath, manifest, patToken);
  } catch (err) {
    core.setFailed(err.message);
  }
}

try {
  run();
} catch (err) {
  core.setFailed(err.message);
}
