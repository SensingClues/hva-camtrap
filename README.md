# HVA Cameretrap Project
cameratrap image classification and object detection

## Tensorflow object detection API
The [tensorflow object-detection API](https://github.com/tensorflow/models/tree/master/research/object_detection) contains pre-trained models on, amongst others, the open images and iNaturalist datasets.

We apply a pretrained model on the open images dataset which uses hierarchical classification: [faster_rcnn_inception_resnet_v2_atrous_oidv2](https://github.com/tensorflow/models/blob/master/research/object_detection/g3doc/detection_model_zoo).
Labelmaps for the various pretrained model can be found [here](https://github.com/tensorflow/models/tree/master/research/object_detection/data).

## Tensorflow Serving
Tensorflow serving provides a REST api at port 8501. 
* Tensorflow-serving requires models to have a version nr in the model path *path_to_model/xxx/saved_model.pb*
     * If you download a pretrained tensorflow model, change the directory name of saved_model directory to some random version number (e.g. 001))
