#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR=$SCRIPT_DIR/..

cd $BASE_DIR

ENTRIES=". test/test-*.js"

echo "Running 'dependency-check $ENTRIES --missing'"
echo "Anything listed here should be added to package.json"
node_modules/.bin/dependency-check $ENTRIES \
  --ignore-module inspector \
  --missing

missingStatus=$?
echo ""

echo "Running 'dependency-check $ENTRIES --unused'"
echo "Anything listed here should be removed from package.json"
echo "or added to the ignore-module options in tools/check-deps.sh"
node_modules/.bin/dependency-check $ENTRIES \
  --ignore-module dependency-check \
  --ignore-module nodemon \
  --ignore-module standard \
  --unused 

unusedStatus=$?
echo ""

if [ $missingStatus -ne 0 ]; then exit 1; fi
if [ $unusedStatus -ne 0 ]; then exit 1; fi