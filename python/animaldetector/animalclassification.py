import tensorflow_hub as hub
import glob
import tensorflow as tf
import os
import cv2
import numpy as np
from tensorflow_core.python import InteractiveSession, ConfigProto
import json


def get_iwc2020_map(json_path):
    '''retrieve iWildCam2020 label map and rebase to 0-267 range'''
    label_map_2020 = []

    with open(json_path) as f:
        d = json.loads(f.read())
        print('Number of iWildCam2020 categories: ', len(d['categories']))
        count = 0
        for cat in d['categories']:
            base_dict = {}
            base_dict['original_id'] = cat['id']
            base_dict['species'] = cat['name']
            base_dict['new_id'] = count
            label_map_2020.append(base_dict)
            count += 1

    return label_map_2020


def get_improved_model():
    '''get the last improved model.'''

    dir = glob.glob(os.getcwd() + '/../models/animalclassifier/trained_models/*')
    model = max(dir, key=os.path.getctime)

    return model


def resizeAndPad(img, size, padColor):
    '''Bring the images to '''
    h, w = img.shape[:2]
    sh, sw = size

    # interpolation method
    if h > sh or w > sw:  # shrinking image
        interp = cv2.INTER_AREA

    else:  # stretching image
        interp = cv2.INTER_CUBIC

    # aspect ratio of image
    aspect = float(w) / h
    saspect = float(sw) / sh

    if (saspect > aspect) or ((saspect == 1) and (aspect <= 1)):  # new horizontal image
        new_h = sh
        new_w = np.round(new_h * aspect).astype(int)
        pad_horz = float(sw - new_w) / 2
        pad_left, pad_right = np.floor(pad_horz).astype(int), np.ceil(pad_horz).astype(int)
        pad_top, pad_bot = 0, 0

    elif (saspect < aspect) or ((saspect == 1) and (aspect >= 1)):  # new vertical image
        new_w = sw
        new_h = np.round(float(new_w) / aspect).astype(int)
        pad_vert = float(sh - new_h) / 2
        pad_top, pad_bot = np.floor(pad_vert).astype(int), np.ceil(pad_vert).astype(int)
        pad_left, pad_right = 0, 0

    # set pad color
    if len(img.shape) is 3 and not isinstance(padColor,
                                              (list, tuple, np.ndarray)):  # color image but only one color provided
        padColor = [padColor] * 3

    # scale and pad
    scaled_img = cv2.resize(img, (new_w, new_h), interpolation=interp)
    scaled_img = cv2.copyMakeBorder(scaled_img, pad_top, pad_bot, pad_left, pad_right, borderType=cv2.BORDER_CONSTANT,
                                    value=padColor)

    return scaled_img


def preprocess_image(image_path, image_size, pad_color):
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = resizeAndPad(np.array(img), (image_size, image_size), pad_color)
    img = np.array(img)
    img = tf.cast(img, tf.float32) / 255.0
    img = img.numpy()
    image = np.zeros((1, image_size, image_size, 3))
    image[0, :, :, :] = img

    return image


def get_megadetect_results(image_size, pad_color):
    megadetect_dir = os.getcwd() + '/../megadetector_result'

    os.chdir(megadetect_dir)

    images_dir = glob.glob(megadetect_dir + '/*')

    for image_dir in images_dir:
        for _, _, images in os.walk(image_dir + '/cropped'):
            for img in images:
                if img.split('.')[1] == 'jpg':
                    preprocced_img = preprocess_image(image_dir + '/cropped/' + img, image_size, pad_color)
                    classify_image(preprocced_img, image_dir + '/cropped/' + img)


def classify_image(image, image_name):
    global model, iwc2020_map

    predictions = model.predict(image)

    pred_name1 = iwc2020_map[np.argmax(predictions)]['species']
    pred_acc1 = predictions[0][np.argmax(predictions)] * 100
    predictions = np.delete(predictions, np.argmax(predictions[0]))

    pred_name2 = iwc2020_map[np.argmax(predictions)]['species']
    pred_acc2 = predictions[np.argmax(predictions)] * 100
    predictions = np.delete(predictions, np.argmax(predictions[0]))

    pred_name3 = iwc2020_map[np.argmax(predictions)]['species']
    pred_acc3 = predictions[np.argmax(predictions)] * 100

    name = image_name.split('/')[-1]
    print(name, "/".join(image_name.split('/')[:-1]))
    data = {}
    data['image'] = []
    data['image'].append({
        'name': name,
        'prediction_1': pred_name1,
        'accuracy_1': pred_acc1,
        'prediction_2': pred_name2,
        'accuracy_2': pred_acc2,
        'prediction_3': pred_name3,
        'accuracy_3': pred_acc3,
    })

    with open("/".join(image_name.split('/')[:-1])+'/'+name.split('.')[0]+'.json', 'w') as outfile:
        json.dump(data, outfile)
    return


if __name__ == '__main__':

    # config stuff for training with GPU.
    config = ConfigProto()
    config.gpu_options.allow_growth = True
    session = InteractiveSession(config=config)

    # get all the labels.
    annotations_path = os.getcwd() + '/../models/animalclassifier/labels/iwildcam2020_train_annotations.json'
    iwc2020_map = get_iwc2020_map(annotations_path)

    image_size = 200
    pad_color = 125

    model = tf.keras.models.load_model(get_improved_model(), custom_objects={'KerasLayer': hub.KerasLayer})
    model.build([1, image_size, image_size, 3])
    model.compile(optimizer='Adam', loss='sparse_categorical_crossentropy', metrics=['sparse_categorical_accuracy'])
    model.summary()

    get_megadetect_results(image_size, pad_color)
