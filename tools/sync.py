#!/usr/bin/env python3

import os
import json
import argparse
from pathlib import Path
from subprocess import Popen, PIPE, DEVNULL

from qcloud_cos import CosConfig, CosS3Client

from albu_logging import get_logger
logger = get_logger(__file__)

ROOT_DIR = Path(__file__).absolute().parent.parent
os.chdir(ROOT_DIR)


def get_cos_client():
    cfg = get_config()['cos']
    config = CosConfig(Region=cfg['region'],
                       SecretId=cfg['secretId'],
                       SecretKey=cfg['secretKey'],
                       Scheme='https')
    client = CosS3Client(config)
    client.bucket = cfg['bucket']
    return client


def fix_acl(img_dirs=['s']):
    with (ROOT_DIR / 'assets' / '_generated' / 'list' /
          'public.json').open() as fd:
        public_list = set(json.load(fd))

    with (ROOT_DIR / 'assets' / '_generated' / 'metas.json').open() as fd:
        full_list = [x['name'] for x in json.load(fd)]

    client = get_cos_client()
    for filename in full_list:
        for img_dir in img_dirs:
            key = f'assets/{img_dir}/{filename}'
            acl = 'public-read' if filename in public_list else 'private'
            logger.info(f'Setting ACL of {key} to {acl}')
            client.put_object_acl(Bucket=client.bucket, Key=key, ACL=acl)


def get_config():
    with (ROOT_DIR / 'config.json').open() as fd:
        return json.load(fd)


def execute(args, inputs=None):
    logger.info(f'EXECUTING [{" ".join(args)}]')
    p = Popen(args, stdin=PIPE if inputs is not None else None, stdout=DEVNULL)
    if inputs is not None:
        for input in inputs:
            p.communicate(bytes(input, encoding='utf-8'))
    else:
        p.wait()
    return p.returncode


def sync_list():
    lst = [
        ['metas.json', [], 'public', 'local'],
        ['list/public.json', [], 'public', 'remote'],
        ['list/public-msg.json', [], 'public', 'remote'],
        ['list/private-msg.json', [], 'private', 'remote'],
    ]
    local_dir = Path('assets') / '_generated'
    headers = {'cache-control': 'private,max-age=31536000'}

    for filename, default, acl, priority in lst:
        local_filename = local_dir / filename
        local_filename.parent.mkdir(parents=True, exist_ok=True)
        dest_key = f'assets/{filename}'
        if execute(['coscmd', 'info', dest_key]) == 255:
            if not local_filename.exists():
                logger.info(f'Writing {local_filename}')
                local_filename.write_text(json.dumps(default))
        elif priority == 'remote':
            execute([
                'coscmd',
                'download',
                '-f',
                dest_key,
                str(local_filename),
            ])

        execute([
            'coscmd',
            'upload',
            '--sync',
            '-H',
            json.dumps(headers),
            str(local_filename),
            dest_key,
        ])
        if acl == 'public':
            execute([
                'coscmd',
                'putobjectacl',
                '--grant-read',
                'anyone',
                dest_key,
            ])


def main():
    config = get_config()

    if cli_args.fix_acl:
        fix_acl()
        return

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

    if not cli_args.meta_only:
        logger.info('Uploading assets...')
        headers = {'cache-control': 'private,max-age=31536000,immutable'}
        for size in cli_args.img_dirs:
            execute(
                [
                    'coscmd',
                    'upload',
                    '-H',
                    json.dumps(headers),
                    '--sync',
                    '--delete',
                    '--recursive',
                    f'assets/_generated/{size}/',
                    f'assets/{size}/',
                ],
                inputs=['y'],
            )
    logger.info('Syncing list...')
    sync_list()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--meta-only', '-m', action='store_true')
    parser.add_argument('--img-dirs',
                        '-i',
                        nargs='+',
                        default=['s', 'm', 'l', 'ori'])
    parser.add_argument('--fix-acl', '-fa', action='store_true')
    cli_args = parser.parse_args()
    main()