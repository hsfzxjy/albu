#!/usr/bin/env python3

import json
from pathlib import Path


def dump_env(env_dict, path: Path):
    content = '\n'.join(f'{k}={v}' for k, v in env_dict.items())
    path.write_text(content)


if __name__ == '__main__':
    root_dir = Path(__file__).parent.absolute()
    config_file = root_dir / 'config.json'

    auth_config_file = root_dir / 'auth' / 'config.json'
    if not auth_config_file.exists():
        config_file.link_to(auth_config_file)

    config_content = json.loads(config_file.read_text())
    dump_env(
        {
            'TENCENT_SECRET_ID': config_content['cos']['secretId'],
            'TENCENT_SECRET_KEY': config_content['cos']['secretKey'],
        },
        root_dir / 'auth' / '.env',
    )
    dump_env(
        {
            f'VUE_APP_{key}': value
            for key, value in config_content['cos'].items()
        },
        root_dir / 'web' / '.env',
    )

    font_css_file = root_dir / 'web' / 'src' / 'fonts' / 'custom.scss'
    if not font_css_file.exists():
        font_css_file.write_text('')
