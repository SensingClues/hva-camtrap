
import os
from itertools import chain
import pickle
import json
import pandas as pd
from sklearn.model_selection import train_test_split
import tensorflow as tf
from PIL import Image
import numpy as np
import cv2


def get_iwc2020_map(json_path):
	' retrieve iWildCam2020 label map and rebase to 0-267 range'

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


def get_images_and_labels_iwc2020_format(base_path, iwc2020_map):
	'''gets image_paths and corresponding labels from iwc2020 data
	NB - the base class set in terms of integers of iwc2020 has been remapped to 0-267
	'''

	image_paths_full = []
	labels_full = []

	categories = os.listdir(base_path)
	for cat in categories:
		if cat != '.DS_Store':
			images = os.listdir(base_path + '/' + cat)
			label_new = [label['new_id'] for label in iwc2020_map if label['original_id'] == int(cat)]
			labels = [label_new[0] for i in range(len(images))]
			labels_full.append(labels)
			for image in images:
				if image != '.DS_Store':
					path = base_path + '/' + cat + '/' + image
					image_paths_full.append(path)

	labels_full = list(chain.from_iterable(labels_full))

	return labels_full, image_paths_full


# write paths and labels to tfrecord file

def resizeAndPad(img, size, padColor):
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
	img = resizeAndPad(img, (image_size, image_size), pad_color)
	img = np.array(img)

	return img


def get_weight_dict(train_val_test_path, beta, num_classes, target_path):
	train_val_test = pickle.load(open(train_val_test_path, "rb"))

	train_values = train_val_test[0]['label'].value_counts().reset_index()
	train_values['label'] = train_values['label'].astype(float)
	train_values['effective_num'] = train_values['label'].apply(lambda x: 1.0 - np.power(beta, x))
	train_values['effective_num'] = train_values['effective_num'].map(lambda x: '%3.3f' % x)
	train_values['effective_num'] = train_values['effective_num'].astype(float)
	train_values['weights'] = train_values['effective_num'].apply(lambda x: (1.0 - beta) / x)
	train_values['norm_weights'] = train_values['weights'].apply(
		lambda x: x / train_values['weights'].sum() * num_classes)

	weights = train_values['norm_weights'].values
	train_values = train_values.sort_values('index', ascending=True)

	weight_dict = {}

	for index, row in train_values.iterrows():
		weight_dict[int(row['index'])] = row['norm_weights']

	for i in range(num_classes):
		if i not in weight_dict.keys():
			weight_dict[i] = train_values['norm_weights'].max

	with open(target_path, "wb") as f:
		pickle.dump(weight_dict, f)

	return weight_dict


def to_tfrecord(record_file, image_paths_full, labels_full, image_size):
	with tf.io.TFRecordWriter(record_file) as writer:
		count = 0
		pad_color = 125
		for path, label in zip(image_paths_full, labels_full):

			try:
				img = preprocess_image(path, image_size, pad_color)

				if img.shape == (image_size, image_size, 3):
					image_string = img.tostring()
					tf_example = image_example(image_string, label)
					writer.write(tf_example.SerializeToString())
					count += 1
			except Exception as e:
				print(e)
				pass

		print(str(count) + ' images written to tfrecord')


def _bytes_feature(value):
	"""Returns a bytes_list from a string / byte."""
	if isinstance(value, type(tf.constant(0))):
		value = value.numpy() # BytesList won't unpack a string from an EagerTensor.
	return tf.train.Feature(bytes_list=tf.train.BytesList(value=[value]))

def _float_feature(value):
	"""Returns a float_list from a float / double."""
	return tf.train.Feature(float_list=tf.train.FloatList(value=[value]))

def _int64_feature(value):
	"""Returns an int64_list from a bool / enum / int / uint."""
	return tf.train.Feature(int64_list=tf.train.Int64List(value=[value]))

def image_example(image_string, label):

	feature = {
	  'label': _int64_feature(label),
	  'image_raw': _bytes_feature(image_string),
	}
	return tf.train.Example(features=tf.train.Features(feature=feature))


if __name__ == "__main__":

	"""Maak een map met de categorieen/species"""
	annotations_path = os.getcwd() + '/../../models/animalclassifier/labels/iwildcam2020_train_annotations.json'
	iwc2020_map = get_iwc2020_map(annotations_path)


	base_path = os.getcwd() + '/data'
	labels_full, image_paths_full = get_images_and_labels_iwc2020_format(base_path, iwc2020_map)

	total = pd.DataFrame(list(zip(image_paths_full, labels_full)), columns=['image_path', 'label'])

	# get classes that only have 1 observation and thus can't be stratified on

	one_obs = total['label'].value_counts().reset_index()
	one_obs = one_obs[one_obs['label'] <= 3]
	one_obs = one_obs['index'].tolist()

	# remove classes that have <=3 observations from the overall data

	total_filtered = total[~total['label'].isin(one_obs)]

	# split

	X = total_filtered[['image_path']]
	y = total_filtered['label']

	X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.01, random_state=1, stratify=y)
	X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.025, random_state=1, stratify=y_train)

	comb_train = pd.concat([X_train, y_train], axis=1)
	comb_val = pd.concat([X_val, y_val], axis=1)
	comb_test = pd.concat([X_test, y_test], axis=1)

	# get rows from the overall data that belong to classes that have 1 observation and append to train set

	ones = total[total['label'].isin(one_obs)]

	train_full = pd.concat([comb_train, ones])
	train_full = train_full.reset_index(drop=True)

	train_val_test = [train_full, comb_val, comb_test]

	print(train_val_test[0].shape)
	print(train_val_test[1].shape)
	print(train_val_test[2].shape)

	# set image size

	image_size = 200

	# train to tfrecord
	print("train")
	image_paths_train = train_full['image_path'].values.tolist()
	labels_train = train_full['label'].values.tolist()

	train_tfrecord_path = os.getcwd() + '/data/tfrecords/train_images.tfrecord'
	to_tfrecord(train_tfrecord_path, image_paths_train, labels_train, image_size)

	# val to tfrecord
	print("val")
	image_paths_val = comb_val['image_path'].values.tolist()
	labels_val = comb_val['label'].values.tolist()

	val_tfrecord_path = os.getcwd() + '/data/tfrecords/validation_images.tfrecord'
	to_tfrecord(val_tfrecord_path, image_paths_val, labels_val, image_size)

	# test to tfrecord
	print("test")
	image_paths_test = comb_test['image_path'].values.tolist()
	labels_test = comb_test['label'].values.tolist()

	test_tfrecord_path = os.getcwd() + '/data/tfrecords/test_images.tfrecord'
	to_tfrecord(test_tfrecord_path, image_paths_test, labels_test, image_size)


