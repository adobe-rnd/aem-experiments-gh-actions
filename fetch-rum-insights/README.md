# RUM Insights

A github action that retrives RUM bundles and provide insights for the given url

## Usage
This action is to be used inside a Github workflow.

`.github/workflows/segments-sync.yaml`
```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Run at midnight
  workflow_dispatch:  # Enable manual triggering

jobs:
  fetch-rum-insights:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch RUM insights for experiment
        uses: adobe-rnd/aem-experiments-gh-actions/fetch-rum-insights@ruminsights
        with:
          domain-key: ${{ secrets.RUM_DOMAIN_KEY }}
          domain: 'www.maidenform.com'
          days: 30
```
