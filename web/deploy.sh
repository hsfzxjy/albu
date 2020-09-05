#!/bin/bash
# set -ex

if [ "${1}"x != "dry"x ]; then
    npm run build
fi

if [ ! -d dist/ ]; then
    echo dist/ not found
    exit 1
fi

cd dist/
find . -maxdepth 1 -mindepth 1 -not -path '*.map' | while read path; do
    path=${path:2}
    echo Uploading $path
    if [ -d $path ]; then
        echo 'y' | coscmd upload --sync --recursive --delete --ignore '*.map' $path $path
    elif [ -f $path ]; then
        coscmd upload --sync $path $path
    fi
done

echo 'Granting access...'
find . -not -path '*.map' -type f -exec coscmd putobjectacl --grant-read anyone {} \;