# %% imports

import os
import numpy as np
# import pandas as pd
from tqdm import tqdm
# from PIL import Image, ImageDraw
import glob
# import matplotlib.pyplot as plt
# import time
import tensorflow_hub as hub
import tensorflow as tf
import cv2

from operator import itemgetter
from collections import OrderedDict

tf.compat.v1.disable_eager_execution()

tf.__version__
import gc

gc.enable()
cwd = os.getcwd()
output_dir = os.path.join(cwd, "../drawn_boxes/")


# %% draw boxes

def draw_boxes(path, filename, im, result):
    print(filename)

    im_height, im_width, channels = im.shape
    detection_count = 0

    cwd = os.getcwd()
    output_dir = os.path.join(cwd, "../drawn_boxes/")

    os.chdir(output_dir)
    for index, box in enumerate(result['detection_boxes'][:5]):
        if result['detection_classes'][index] == 1 and result['detection_scores'][index] >= 0.95:
            detection_count += 1

            (left, right) = tuple(im_width * np.array(
                (box[1], box[0])
                if box[0] > box[1]
                else (box[0], box[1])
            ))

            (top, bottom) = tuple(im_height * np.array(
                (box[3], box[2])
                if box[2] > box[3]
                else (box[2], box[3])
            ))
            # if int(left) is int(right) or int(top) is int(bottom):
            cv2.rectangle(im, (int(left), int(top)), (int(right), int(bottom)), (0, 0, 255), 2)

            print(path, "\n", (im.shape), "\n", (left, right, top, bottom))

            print(im[int(top):int(bottom), int(left):int(right), :].shape)
            cv2.imwrite("".join([filename.split(".")[0], "_cropped", str(detection_count), ".jpg"]),
                        im[int(top):int(bottom), int(left):int(right)])

        if detection_count > 0:
            cv2.imwrite("".join([filename.split(".")[0], ".jpg"]), im)

        '''Trying to clear out some memory'''
        left = right = top = bottom = cropped = None
        del (left, right, top, bottom, cropped)

    detection_count = im_width = im_height = draw = im = None
    del (detection_count, im_width, im_height, draw, path, filename, im, result)

    os.chdir(cwd)


# %% detection
def main():
    gc.enable()

    __slots__ = ['files', 'file', 'img', 'module', 'sess']
    module = hub.Module("https://tfhub.dev/microsoft-ai-for-earth/vision/detector/megadetector_V3/1")
    height, width = hub.get_expected_image_size(module)
    # for i in tqdm(range(0, 290, 10)):
    files = glob.glob("../Dataset/test/*.jpg")
    for file in tqdm(files):
        sess = tf.compat.v1.Session()
        filename = file.split("/")[-1:][0]
        testset = np.zeros((1, height, width, 3), dtype='f2')

        print(file)

        img = cv2.resize(cv2.imread(file), (width, height))
        print(type(img))

        testset[0, :, :, :] = img
        output = module(testset, as_dict=True)

        output_dict = {
            'detection_scores': output['detection_scores'].eval(session=sess)[0],
            'detection_classes': output['detection_classes'].eval(session=sess)[0],
            'detection_boxes': output['detection_boxes'].eval(session=sess)[0]
        }

        output_dict = OrderedDict(sorted(output_dict.items(), key=lambda x: x[0], reverse=True))

        draw_boxes(file, filename, img, output_dict)

        '''Trying to clear out some memory'''
        utput_dict = img = testset = filename = sess = None


if __name__ == "__main__":
    main()