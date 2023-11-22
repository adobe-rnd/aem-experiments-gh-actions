# Segments Sync

A github action that retrieves the Segment definitions from AEP and caches it in the AEM EDS repository so it's readily available from the code-bus to offer the best performance on the client.

## Usage
This action is to be used inside a Github workflow.

`.github/workflows/segments-sync.yaml`
```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Run at midnight
  workflow_dispatch:  # Enable manual triggering

jobs:
  sync-segments-from-aep:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    steps:
      - name: Sync Segments from AEP
        uses: adobe-rnd/aem-experiments-gh-actions/segments-sync@main
        with:
          aio_console_client_id: ${{ secrets.aio_console_client_id }}
          aio_console_client_secret: ${{ secrets.aio_console_client_secret }}
          aio_console_ims_org_id: ${{ secrets.aio_console_ims_org_id }}
          aio_console_technical_account_email: ${{ secrets.aio_console_technical_acccount_email }}
          aio_console_technical_account_id: ${{ secrets.aio_console_technical_acccount_id }}
          git_pat_token: ${{ secrets.git_pat_token }}
          git_repo: ${{ github.repository }}
          git_ref: ${{ github.ref_name }}
          segments_path: 'all_segments.json'
```

## Prerequisites

- Make sure you have AEP provisioned for your IMS org and access to the [developer console](https://developer.adobe.com/console/)
- Make sure you have an [AEM EDS project](https://www.aem.live/docs/) set up and instrumented with the [AEM Experimentation plugin](https://github.com/adobe/aem-experimentation).

## Set up

1. Go to [developer console](https://developer.adobe.com/console/)
2. Create a new project in your organisation, or re-use an existing one
3. Add the **Experience Platform API** to the project workspace using the **OAuth Server-to-Server** credentials for the API
4. Keep the credential details readily available (you’ll need those in the below steps)
5. Go to Permissions area in [Experience Platform](https://experience.adobe.com/admin/permissions) and select a role that has the necessary permissions needed to read the segment definitions and click on it
6. Go to API Credentials tab and add your newly created API Credentials. You can search using the Technical Account Email obtained in the step #4. This step is mandatory, otherwise the token generated will not be able to access the segments API. You can also check the [documentation](https://experienceleague.adobe.com/docs/experience-platform/landing/platform-apis/api-authentication.html#get-abac-permissions)
7. Add the GitHub workflow above (see Usage) to your GitHub repository under `.github/workflows/segments-sync.yaml`
8. Add the following [action secrets](https://github.com/ramboz/aem-experience-decisioning-demo/settings/secrets/actions) to your GitHub repository. Those should be set to the values from step 4.
    - AIO_CONSOLE_CLIENT_ID
    - AIO_CONSOLE_CLIENT_SECRET
    - AIO_CONSOLE_IMS_ORG_ID
    - AIO_CONSOLE_TECHNICAL_ACCCOUNT_EMAIL
    - AIO_CONSOLE_TECHNICAL_ACCCOUNT_ID