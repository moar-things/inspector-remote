#!/usr/bin/env bash

# need the nvm function
. ~/.nvm/nvm.sh

nvm exec  8 npm run utest
nvm exec 10 npm run utest
nvm exec 11 npm run utest