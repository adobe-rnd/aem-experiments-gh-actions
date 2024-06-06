import unittest
import json
import sys
import os

cwd = os.environ['PWD']
sys.path.insert(0, cwd + '/run-mab/')
from mab import main


class TestMab(unittest.TestCase):
    def setUp(self):
        # Load test data
        f = open(cwd + '/run-mab/tests/integration/fixtures/test.json')
        self.data = json.load(f)
        f.close()

    def test_mab(self):
        result = main(self.data)
        print(result)

if __name__ == '__main__':
    unittest.main()