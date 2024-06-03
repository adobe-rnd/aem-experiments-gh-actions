#!/usr/bin/env python

# coding: utf-8

import os
import sys

print(sys.argv[1:])

for key, value in os.environ.items():
    print('{}: {}'.format(key, value))

# TODO: add logic here

# import json
# data = json.loads('{"one" : "1", "two" : "2", "three" : "3"}')
# print(data['two'])  # or `print data['two']` in Python 2