#!/usr/bin/env python3
import os
import shutil
import argparse
from glob import glob
from pathlib import Path

from PIL import Image

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import *
from PyQt5.QtGui import QImage, QPixmap, QPalette


class QImageViewer(QMainWindow):
    def __init__(self, args):
        super().__init__()
        self.args = args
        self.fileList = sorted(glob(args.src, recursive=True))
        self.index = 0

        self.scaleFactor = 0.0

        self.imageLabel = QLabel()
        self.imageLabel.setBackgroundRole(QPalette.Base)
        self.imageLabel.setSizePolicy(QSizePolicy.Ignored, QSizePolicy.Ignored)
        self.imageLabel.setScaledContents(True)

        self.scrollArea = QScrollArea()
        self.scrollArea.setBackgroundRole(QPalette.Dark)
        self.scrollArea.setWidget(self.imageLabel)
        self.scrollArea.setVisible(False)

        self.setCentralWidget(self.scrollArea)

        self.setWindowTitle("Image Selector")
        self.resize(800, 600)

        self.open()

    def currentFilePath(self):
        self.index = self.index % len(self.fileList)
        return self.fileList[self.index]

    def savedPath(self):
        fileName = self.currentFilePath()
        dest_dir = Path(self.args.dest)
        dest_dir.mkdir(parents=True, exist_ok=True)
        return (dest_dir / Path(fileName).name).absolute()

    def updateMessage(self):
        status = self.statusBar()
        savedPath = self.savedPath()
        msg = '[{}/{}] {}'.format(self.index + 1, len(self.fileList),
                                  self.currentFilePath())
        if savedPath.exists():
            msg += ' -> ' + str(savedPath)
        else:
            msg += ' (UNSAVED)'
        status.showMessage(msg)

    def save(self):
        savedPath = self.savedPath()
        if savedPath.exists():
            return

        savedPath.symlink_to(self.currentFilePath())
        self.updateMessage()

    def unsave(self):
        savedPath = self.savedPath()
        if not savedPath.exists():
            return

        self.savedPath().unlink()
        self.updateMessage()

    def keyPressEvent(self, event):
        if event.key() == Qt.Key_Space:
            self.save()
        elif event.key() == Qt.Key_X:
            self.unsave()
        elif event.key() == Qt.Key_A:
            self.index -= 1
            self.open()
        elif event.key() == Qt.Key_D:
            self.index += 1
            self.open()

    def open(self):
        fileName = self.currentFilePath()
        image = QImage(fileName)
        if image.isNull():
            QMessageBox.information(self, "Image Viewer",
                                    "Cannot load %s." % fileName)
            return

        self.imageLabel.setPixmap(QPixmap.fromImage(image))
        self.scaleFactor = 1.0

        self.scrollArea.setVisible(True)
        self.imageLabel.adjustSize()
        self.scrollArea.setWidgetResizable(True)
        self.updateMessage()

    def scaleImage(self, factor):
        self.scaleFactor *= factor
        self.imageLabel.resize(self.scaleFactor *
                               self.imageLabel.pixmap().size())

        self.adjustScrollBar(self.scrollArea.horizontalScrollBar(), factor)
        self.adjustScrollBar(self.scrollArea.verticalScrollBar(), factor)

        self.zoomInAct.setEnabled(self.scaleFactor < 3.0)
        self.zoomOutAct.setEnabled(self.scaleFactor > 0.333)

    def adjustScrollBar(self, scrollBar, factor):
        scrollBar.setValue(
            int(factor * scrollBar.value() +
                ((factor - 1) * scrollBar.pageStep() / 2)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--src', default='/usr/data/Photos/DCIM/Camera/*.jpg')
    parser.add_argument('--dest', default='assets/source/')

    app = QApplication([])
    window = QImageViewer(parser.parse_args())
    window.show()
    app.exec_()


if __name__ == '__main__':
    main()
