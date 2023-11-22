const { Base64 } = require('js-base64');
const core = require('@actions/core');
const github = require('@actions/github');
const http = require('@actions/http-client');
const { context: imsContext, getToken } = require('@adobe/aio-lib-ims');

const BOT_NAME = 'aem-experimentation-segments-sync';

const SEGMENT_PROPERTIES = ['id', 'name', 'description'];

const DEFAULT_SEGMENTS_API_ENDPOINT = 'https://platform.adobe.io/data/core/ups/segment/definitions';

const DEFAULT_SEGMENTS_PATH_IN_REPO = 'segments.json';

const DEFAULT_SANDBOX_NAME = 'prod';

const client = new http.HttpClient(BOT_NAME);

/**
 * Build a context object that contains alls secrets and variables used across the action.
 * @returns a context object with references to the main variables
 */
function getActionContext() {
  const git_repo = core.getInput('git_repo', { required: true });
  const [owner, repo] = git_repo.split('/');
  const ref = core.getInput('git_ref');
  const segmentsPathInRepo = core.getInput('segments_path') || DEFAULT_SEGMENTS_PATH_IN_REPO;
  const segmentsApiEndpoint = core.getInput('segments_api_endpoint') || DEFAULT_SEGMENTS_API_ENDPOINT;
  const sandboxName = core.getInput('sandbox_name') || DEFAULT_SANDBOX_NAME;

  return {
    // Secrets
    clientId: core.getInput('aio_console_client_id', { required: true }),
    clientSecret: core.getInput('aio_console_client_secret', { required: true }),
    imsOrgId: core.getInput('aio_console_ims_org_id', { required: true }),
    technicalAccountEmail: core.getInput('aio_console_technical_account_email', { required: true }),
    technicalAccountId: core.getInput('aio_console_technical_account_id', { required: true }),
    gitToken: core.getInput('git_pat_token', { required: true }),
    // Variables
    segmentsPathInRepo,
    segmentsApiEndpoint,
    sandboxName,
    owner,
    repo,
    ref,
  };
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
    scopes: ['openid', 'AdobeID', 'read_organizations', 'additional_info.projectedProductContext', 'session'],
  });
  return getToken(BOT_NAME);
}

async function getSegmentsFromAEP(context, accessToken) {
  const response = await client.get(context.segmentsApiEndpoint,
    {
      'Authorization': `Bearer ${accessToken}`,
      'x-api-key': context.clientId,
      'x-gw-ims-org-id': context.imsOrgId,
      'x-sandbox-name': context.sandboxName,
    }
  );
  if (response.message.statusCode >= 400) {
    console.error('Error response from AEP. Invalid configuration ', response.message.statusMessage);
    return null;
  }
  const extractedSegments = [];
  const segmentsJson = await response.readBody().then(JSON.parse);
  const segments = segmentsJson.segments ? segmentsJson.segments : [];
  segments.forEach((segment) => {
    const extractedSegment = {};
    SEGMENT_PROPERTIES.forEach((property) => {
      if (segment[property]) {
        extractedSegment[property] = segment[property];
      }
    });
    if (Object.keys(extractedSegment).length > 0) {
      extractedSegments.push(extractedSegment);
    }
  });
  return extractedSegments;
}

async function addOrUpdateSegmentsInRepo(context, segments) {
  const { owner, repo, ref, octokit } = context;
  const content = Base64.encode(JSON.stringify(segments));
  let oldSegmentsContent;
  try {
    const result = await octokit.rest.repos.getContent({owner, repo, ref, path: context.segmentsPathInRepo });
    oldSegmentsContent = result.data;
  } catch (err) {
    oldSegmentsContent = null;
  }

  if (oldSegmentsContent && oldSegmentsContent.content.replace(/\n/g, '') === content) {
    console.debug(`Segments at [${context.segmentsPathInRepo}] are already upto date`);
    return;
  }

  return octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    branch: ref,
    path: context.segmentsPathInRepo,
    message: `chore: update AEP segments cache at ${context.segmentsPathInRepo}`,
    content,
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
 
    const accessToken = await getImsAccessToken(context);
    const segments = await getSegmentsFromAEP(context, accessToken);
    // persiste the segments in the git repo
    await addOrUpdateSegmentsInRepo(context, segments);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
