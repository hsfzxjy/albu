import logging
from pathlib import Path


def get_logger(filename):
    logging.basicConfig(
        level=logging.INFO,
        format='[%(levelname)s, %(name)s] %(asctime)s %(message)s',
    )
    return logging.getLogger(Path(filename).name)
