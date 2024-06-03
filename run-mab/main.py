#!/usr/bin/env python
# coding: utf-8

import json
import mab
import os
import sys

def set_output(name, value):
  with open(os.environ['GITHUB_OUTPUT'], 'a') as fh:
    print(f'{name}={value}', file=fh)


# The RUM data
rumDataString = sys.argv[1]

# The conversion checkpoint to use
conversionName = sys.argv[2]
if len(conversionName) == 0:
  conversionName = 'convert'

# The conversion value
conversionValue = sys.argv[3]

data = json.loads(rumDataString)

mab_config = {}
for url in data:
  mab_config[url] = {}
  page = data[url]
  for experiment in page:
    res = mab.main(experiment)
    mab_config[url][experiment['experiment']] = res

set_output('config', mab_config)