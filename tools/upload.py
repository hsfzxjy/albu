#!/usr/bin/env python3

import os
import json
from pathlib import Path
from subprocess import Popen

from albu_logging import get_logger
logger = get_logger(__file__)

ROOT_DIR = Path(__file__).absolute().parent.parent
os.chdir(ROOT_DIR)


def get_config():
    with (ROOT_DIR / 'config.json').open() as fd:
        return json.load(fd)


def execute(args):
    p = Popen(args)
    p.wait()
    return p.returncode


def main():
    config = get_config()

    logger.info('Configuring COS...')
    execute([
        'coscmd',
        'config',
        '-a',
        config['cos']['secretId'],
        '-s',
        config['cos']['secretKey'],
        '-b',
        config['cos']['bucket'],
        '-r',
        config['cos']['region'],
    ])

    headers = {'cache-control': 'private,max-age=31536000,immutable'}
    logger.info('Uploading assets...')
    execute([
        'coscmd',
        'upload',
        '-H',
        json.dumps(headers),
        '--sync',
        '--delete',
        '--recursive',
        '--ignore',
        'assets/_generated/public.json',
        'assets/_generated/',
        'assets/',
    ])
    logger.info('Granting permissions...')
    execute([
        'coscmd',
        'putobjectacl',
        '--grant-read',
        'anyone',
        'assets/metas.json',
    ])

    if execute(['coscmd', 'info', 'assets/public.json']) != 0:
        logger.info('Writing assets/public.json...')
        execute([
            'coscmd',
            'upload',
            'assets/_generated/public.json',
            'assets/public.json',
        ])
    execute([
        'coscmd',
        'putobjectacl',
        '--grant-read',
        'anyone',
        'assets/public.json',
    ])


if __name__ == '__main__':
    main()