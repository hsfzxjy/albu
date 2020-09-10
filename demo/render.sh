#!/bin/bash
set -uex

for profile in _profile/*.json; do
    name=$(basename ${profile})
    dest_file="assets/${name/.json/.gif}"
    temp_gif=$(mktemp)
    rm ${temp_gif}
    temp_gif=${temp_gif}.gif
    snapline ${profile} -o ${temp_gif}
    gifsicle -O3 --colors 256 ${temp_gif} -o ${dest_file}
    rm ${temp_gif}
done