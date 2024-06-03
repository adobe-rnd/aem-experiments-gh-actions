#!/usr/bin/env python
# coding: utf-8

import json
import mab
import os
import sys

# The RUM data
rumDataString = sys.argv[1]

# The conversion checkpoint to use
conversionName = sys.argv[2]
if len(conversionName) == 0:
  conversionName = 'convert'

# The conversion value
conversionValue = sys.argv[3]

data = json.loads(rumDataString)

for url in data:
  page = data[url]
  for experiment in page:
    res = mab.main(experiment)
    print(url, experiment['experiment'], res)