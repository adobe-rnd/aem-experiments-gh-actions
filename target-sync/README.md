# Target Sync

A github action that retrieves the Target experiment config for the published page and caches it in the AEM EDS repository so it's readily available from the code-bus to offer the best performance on the client.

## Usage
This action is to be used inside a Github workflow.

`.github/workflows/target-sync.yaml`
```yaml
on: 
  repository_dispatch:
    types:
      - resource-previewed
      - resource-unpreviewed
      - resource-published
      - resource-unpublished

jobs:
  sync-with-target:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    steps:
      - name: Sync Target Experiment config
        uses: adobe-rnd/aem-experiments-gh-actions/target-sync@main
        if: ${{ endsWith(github.event.client_payload.path, '.md') }}
        with:
          aio_console_client_id: ${{ secrets.aio_console_client_id }}
          aio_console_client_secret: ${{ secrets.aio_console_client_secret }}
          aio_console_ims_org_id: ${{ secrets.aio_console_ims_org_id }}
          aio_console_technical_account_email: ${{ secrets.aio_console_technical_acccount_email }}
          aio_console_technical_account_id: ${{ secrets.aio_console_technical_acccount_id }}
          target_tenant: ${{ secrets.target_tenant }}
          git_pat_token: ${{ secrets.GITHUB_TOKEN }}
          resource_path: ${{ github.event.client_payload.path }}
          git_repo: ${{ github.repository }}
          git_ref: ${{ github.ref_name }}
```

## Prerequisites

- Make sure you have Target provisioned for your IMS org and access to the [developer console](https://developer.adobe.com/console/)
- Make sure you have an [AEM EDS project](https://www.aem.live/docs/) set up and instrumented with the [AEM Experimentation plugin](https://github.com/adobe/aem-experimentation).

## Set up

1. Go to [developer console](https://developer.adobe.com/console/)
2. Create a new project in your organisation, or re-use an existing one
3. Add the **Adobe Target API** to the project workspace using the **OAuth Server-to-Server** credentials for the API
4. Keep the credential details readily available (you’ll need those in step 6. below)
5. Add the GitHub workflow above (see Usage) to your GitHub repository under `.github/workflows/target-sync.yaml`
6. Add the following [action secrets](https://github.com/ramboz/aem-experience-decisioning-demo/settings/secrets/actions) to your GitHub repository. Those should be set to the values from step 4.
    - AIO_CONSOLE_CLIENT_ID
    - AIO_CONSOLE_CLIENT_SECRET
    - AIO_CONSOLE_IMS_ORG_ID
    - AIO_CONSOLE_TECHNICAL_ACCCOUNT_EMAIL
    - AIO_CONSOLE_TECHNICAL_ACCCOUNT_ID
    - TARGET_TENANT