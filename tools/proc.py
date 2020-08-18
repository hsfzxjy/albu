#!/usr/bin/env python3

import json
import hashlib
import argparse
import datetime
from io import BytesIO
from pathlib import Path
from PIL import Image, ExifTags

import multiprocessing
from multiprocessing.pool import Pool


def parse_time(datestr):
    dt = datetime.datetime.strptime(datestr, '%Y:%m:%d %H:%M:%S')
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone(datetime.timedelta(hours=8)))
    return dt.isoformat()


class Processor:
    @classmethod
    def process_and_get_meta(cls, file_path):
        processor = cls(file_path)
        processor.save()
        return processor.meta

    def __init__(self, file_path):
        self.file_path = file_path
        self.open_image()

    def resize(self, image, bbox=None):
        if bbox is None:
            return image
        image = image.copy()
        image.thumbnail(bbox)
        return image

    def open_image(self):
        image = Image.open(str(self.file_path))

        exif = image._getexif()
        time = parse_time(exif[0x0132])
        orientation = exif[0x0112]
        degree = {3: 180, 6: 270, 8: 90}.get(orientation)
        if degree is not None:
            image = image.rotate(degree, expand=True)

        meta = {
            'hw': [image.height, image.width],
            'time': time,
            'name': self.file_path.name
        }

        imgs = {}
        for name, bbox in [
            ['s', [800, 800]],
            ['m', [1600, 1600]],
            ['l', [2400, 2400]],
            ['ori', None],
        ]:
            imgs[name] = self.resize(image, bbox)

        self.meta, self.imgs = meta, imgs

    def _save_file(self, dest_file_path: Path, image):
        buffer = BytesIO()
        image.save(buffer, format='jpeg', optimize=True, quality=args.quality)
        if dest_file_path.exists():
            hasher = hashlib.md5()
            buffer.seek(0)
            hasher.update(buffer.getbuffer())

            local_hasher = hashlib.md5()
            local_hasher.update(dest_file_path.read_bytes())

            if hasher.digest() == local_hasher.digest():
                print('Skipping', dest_file_path, '(File unchanged)')
                return
            else:
                print(dest_file_path, 'TRUNCATED')

        print('Saving', dest_file_path)
        dest_file_path.write_bytes(buffer.getbuffer())

    def save(self):
        for name, img in self.imgs.items():
            dest_dir = self.file_path.parent.parent / name
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_file_path = dest_dir / self.file_path.name
            self._save_file(dest_file_path, img)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-a',
                        '--assets-dir',
                        default=Path('assets/'),
                        type=Path)
    parser.add_argument('-q', '--quality', default=85, type=int)
    parser.add_argument('-p',
                        '--nproc',
                        default=multiprocessing.cpu_count(),
                        type=int)
    args = parser.parse_args()

    metas = Pool(processes=args.nproc).map(
        Processor.process_and_get_meta,
        Path(args.assets_dir / 'source').glob('*.jpg'))
    meta_file_path = args.assets_dir / 'metas.json'
    print('Saving meta to', meta_file_path)
    with meta_file_path.open('w') as fd:
        json.dump(metas, fd)