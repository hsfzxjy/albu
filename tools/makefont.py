#!/usr/bin/env python3
import os
import argparse
import tempfile
import subprocess
from glob import glob
from pathlib import Path

from albu_tools_utils import get_logger, execute
logger = get_logger(__file__)

ROOT_DIR = Path(__file__).absolute().parent.parent
WORK_DIR = ROOT_DIR / 'web' / 'src' / 'fonts'

PUNCTUATION = list('，。？“”—《》「」『』！（）')
ASCII = list(chr(id) for id in range(0x0, 0x7F))


def unicode_to_hex(char):
    return 'U+' + hex(ord(char))[2:].upper().zfill(4)


def main(args):
    os.chdir(WORK_DIR)
    char_list = [
        line.strip()
        for line in (WORK_DIR / 'freq.csv').read_text().split('\n')
    ]

    logger.info('Remove built fonts...')
    for filename in WORK_DIR.glob('custom-*.ttf'):
        os.remove(filename)

    chunk_size = args.chunk_size
    start = 0

    font_faces = []
    font_families = []

    while chunk_size + start < len(char_list):
        chunk = char_list[start:start + chunk_size]
        if start == 0:
            chunk.extend(PUNCTUATION + ASCII)

        with tempfile.NamedTemporaryFile('w') as f:
            f.writelines(map(unicode_to_hex, chunk))
            f.flush()

            logger.info(f'Subsetting {start} ~ {start + chunk_size - 1}...')
            execute([
                'pyftsubset',
                f'--unicodes-file={f.name}',
                args.font,
                f'--output-file=custom-{start}.ttf',
            ], logger)

            font_faces.append(f'''
                @font-face {{
                    font-family: custom-{start};
                    src: url(~@/fonts/custom-{start}.ttf);
                }}''')

            font_families.append(f"custom-{start}")

        start += chunk_size

    font_class = f"""
    .custom-font {{
        font-family: {', '.join(font_families)}, "SimSun", "宋体" !important;
    }}
    """

    logger.info('Writing styles...')
    (WORK_DIR / 'custom.scss').write_text(
        os.linesep.join(font_faces + [font_class]))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--font', default='custom.ttf')
    parser.add_argument('--chunk-size', default=500)
    args = parser.parse_args()

    main(args)