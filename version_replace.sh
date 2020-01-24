#!/bin/bash

VERSION=$(node -e "(function () { console.log(require('./package.json').version) })()")

replace 'REDUX_SDK_VERSION_NUMBER' $VERSION ./lib/constants.js ./es/constants.js

if [ $? -eq 0 ]
then
  exit 0
else
  exit 1
fi
