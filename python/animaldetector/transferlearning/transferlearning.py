import tensorflow_hub as hub
import tensorflow as tf
import os
import numpy as np
from PIL import Image
import pickle
import json
from tensorflow.compat.v1 import ConfigProto
from tensorflow.compat.v1 import InteractiveSession
import glob

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


def _parse_image_function_train(example_proto):
	# Parse the input tf.Example proto using the dictionary above.

	image_feature_description = {
		'label': tf.io.FixedLenFeature([], tf.int64),
		'image_raw': tf.io.FixedLenFeature([], tf.string),
	}

	example = tf.io.parse_single_example(example_proto, image_feature_description)
	image_shape = tf.stack([200, 200, 3])
	image_raw = example['image_raw']
	class_label = tf.cast(example['label'], tf.float32)
	image = tf.io.decode_raw(image_raw, tf.uint8)
	image = tf.cast(image, tf.float32)
	image = tf.reshape(image, image_shape)

	return image, class_label


def _parse_image_function_val(example_proto):
	# Parse the input tf.Example proto using the dictionary above.

	image_feature_description = {
		'label': tf.io.FixedLenFeature([], tf.int64),
		'image_raw': tf.io.FixedLenFeature([], tf.string),
	}

	example = tf.io.parse_single_example(example_proto, image_feature_description)
	image_shape = tf.stack([200, 200, 3])
	image_raw = example['image_raw']
	class_label = tf.cast(example['label'], tf.float32)
	image = tf.io.decode_raw(image_raw, tf.uint8)
	image = tf.cast(image, tf.float32)/255
	image = tf.reshape(image, image_shape)

	return image, class_label


def augment(image, label):
	image = tf.image.random_flip_left_right(image)

	image = tf.cast(image, tf.float32)/255
	image_shape = tf.stack([200, 200, 3])
	image = tf.reshape(image, image_shape)

	return image, label


def get_tfrecord_train(record_file, batch_size, epochs):
	ds_base = tf.data.TFRecordDataset(record_file)
	ds_base = ds_base.shuffle(1500, reshuffle_each_iteration=True)
	ds_base = ds_base.map(_parse_image_function_train)
	ds_base = ds_base.repeat(epochs)
	ds_base = ds_base.map(augment, num_parallel_calls=tf.data.experimental.AUTOTUNE)
	ds_base_batch = ds_base.batch(batch_size)
	ds_base_batch = ds_base_batch.prefetch(tf.data.experimental.AUTOTUNE)

	print('tfrecord retrieved')

	return ds_base, ds_base_batch


def get_tfrecord_val(record_file, batch_size, epochs):
	ds_base = tf.data.TFRecordDataset(record_file)
	ds_base = ds_base.shuffle(1500, reshuffle_each_iteration=True)
	ds_base = ds_base.map(_parse_image_function_val)
	ds_base = ds_base.repeat(epochs)
	ds_base_batch = ds_base.batch(batch_size)
	ds_base_batch = ds_base_batch.prefetch(tf.data.experimental.AUTOTUNE)

	print('tfrecord retrieved')

	return ds_base, ds_base_batch


def get_improved_model():
    '''get the last improved model.'''

    dir = glob.glob(os.getcwd() + '/../../models/animalclassifier/trained_models/*')
    model = max(dir, key=os.path.getctime)

    return model

class LossAndErrorPrintingCallback(tf.keras.callbacks.Callback):

	def on_epoch_end(self, epoch, logs=None):
		print(' keys: ', logs.keys())
		print(' The average loss for epoch {} is {:7.2f} and sparse_categorical_accuracy is {:7.2f}.'.format(epoch, logs['loss'], logs['sparse_categorical_accuracy']))


if __name__ == "__main__":
	config = ConfigProto()
	config.gpu_options.allow_growth = True
	session = InteractiveSession(config=config)

	# retrieve tfrecords

	train_tfrecord_path = os.getcwd() + '/data/tfrecords/train_images.tfrecord'
	val_tfrecord_path = os.getcwd() + '/data/tfrecords/validation_images.tfrecord'

	num_samples_train = sum(1 for _ in tf.data.TFRecordDataset(train_tfrecord_path))
	num_samples_val = sum(1 for _ in tf.data.TFRecordDataset(val_tfrecord_path))

	# set params

	epochs = 3

	batch_size_train = 24
	steps_per_epoch = int(num_samples_train / batch_size_train)


	batch_size_val = 350
	validation_steps = 11

	image_size = 200

	# get mappings

	annotations_path = os.getcwd() + '/../../models/animalclassifier/labels/iwildcam2020_train_annotations.json'
	iwc2020_map = get_iwc2020_map(annotations_path)


	ds_train_base, ds_train_batch = get_tfrecord_train(train_tfrecord_path, batch_size_train, epochs)
	ds_val_base, ds_val_batch = get_tfrecord_val(val_tfrecord_path, batch_size_val, epochs)

	num_classes = len(iwc2020_map)

	model_path = get_improved_model()

	m = tf.keras.models.load_model(model_path, custom_objects={'KerasLayer': hub.KerasLayer})
	m.build([None, image_size, image_size, 3])
	m.compile(optimizer='Adam', loss='sparse_categorical_crossentropy', metrics=['sparse_categorical_accuracy'])

	filepath_mod = "/../../models/animalclassifier/trained_models/weights-improvement-{epoch:02d}-{val_sparse_categorical_accuracy:.2f}-" + str(
		id) + ".hdf5"
	checkpoint_val = tf.keras.callbacks.ModelCheckpoint(
		filepath_mod,
		monitor='val_sparse_categorical_accuracy',
		verbose=1,
		save_best_only=True,
		save_weights_only=False,
		mode='max')

	# set up tensorboard logging

	tensorboard_log = tf.keras.callbacks.TensorBoard(
		log_dir='/../../models/animalclassifier/trained_models/logs', histogram_freq=0, write_graph=True, write_images=False,
		update_freq=50, profile_batch=0, embeddings_freq=0,
		embeddings_metadata=None)

	callbacks_list = [LossAndErrorPrintingCallback(), checkpoint_val, tensorboard_log]

	m.fit(ds_train_batch, steps_per_epoch=steps_per_epoch, epochs=epochs, validation_data=ds_val_batch, validation_steps=validation_steps, callbacks=callbacks_list)
