#!/usr/bin/env python

# coding: utf-8

import os
import sys

print(sys.argv[1:])

for key, value in os.environ.items():
    print('{}: {}'.format(key, value))

# TODO: add logic here