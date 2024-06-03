#!/usr/bin/env python
# coding: utf-8

import json
import os
import sys

# The RUM data
rumDataString = sys.argv[1]

# The conversion checkpoint to use
conversionName = sys.argv[2]
if len(conversionName) == 0
  conversionName = 'convert'

# The conversion value
conversionValue = sys.argv[3]

data = json.loads(rumDataString)
for idx1, page in enumerate(data):
  for idx2, experiment in enumerate(page):
    print(idx1, idx2, experiment)
