import logging
from pathlib import Path
from subprocess import Popen, DEVNULL, PIPE


def get_logger(filename):
    logging.basicConfig(
        level=logging.INFO,
        format='[%(levelname)s, %(name)s] %(asctime)s %(message)s',
    )
    return logging.getLogger(Path(filename).name)


def execute(args, logger, inputs=None):
    logger.info(f'EXECUTING [{" ".join(args)}]')
    p = Popen(args, stdin=PIPE if inputs is not None else None, stdout=DEVNULL)
    if inputs is not None:
        for input in inputs:
            p.communicate(bytes(input, encoding='utf-8'))
    else:
        p.wait()
    return p.returncode