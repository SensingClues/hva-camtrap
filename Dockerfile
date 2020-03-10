# Stable tensorflow base image
FROM tensorflow/tensorflow:1.15.0-gpu-py3

# Get the tensorflow models research directory, and move it into tensorflow
# source folder to match recommendation of installation

# Install wget (to make life easier below) and editors (to allow people to edit
# the files inside the container)
RUN apt-get update --fix-missing
RUN apt-get install -y git wget vim emacs nano

RUN mkdir tensorflow

RUN git clone --depth 1 https://github.com/tensorflow/models.git && \
    mv models /tensorflow/models

# Install the Tensorflow Object Detection API from here
# https://github.com/tensorflow/models/blob/master/research/object_detection/g3doc/installation.md

# Install object detection api dependencies
# Note: requires time zone information: https://askubuntu.com/questions/909277/avoiding-user-interaction-with-tzdata-when-installing-certbot-in-a-docker-contai
ENV TZ=Europe/Amsterdam
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get install -y protobuf-compiler python-pil python-lxml python-tk && \
    pip install Cython && \
    pip install contextlib2 && \
    pip install jupyter && \
    pip install matplotlib && \
    pip install pillow

# Install pycocoapi
RUN git clone --depth 1 https://github.com/cocodataset/cocoapi.git && \
    cd cocoapi/PythonAPI && \
    make -j8 && \
    cp -r pycocotools /tensorflow/models/research && \
    cd ../../ && \
    rm -rf cocoapi

# Get protoc 3.0.0, rather than the old version already in the container
RUN curl -OL "https://github.com/google/protobuf/releases/download/v3.0.0/protoc-3.0.0-linux-x86_64.zip" && \
    unzip protoc-3.0.0-linux-x86_64.zip -d proto3 && \
    mv proto3/bin/* /usr/local/bin && \
    mv proto3/include/* /usr/local/include && \
    rm -rf proto3 protoc-3.0.0-linux-x86_64.zip

# Run protoc on the object detection repo
RUN cd /tensorflow/models/research && \
    protoc object_detection/protos/*.proto --python_out=.

# Set the PYTHONPATH to finish installing the API
ENV PYTHONPATH $PYTHONPATH:/tensorflow/models/research:/tensorflow/models/research/slim

WORKDIR /tensorflow

# TODO: decide on some folder structure here.
# Create custom object detection model
RUN mkdir -p workspace/training_demo

WORKDIR /tensorflow/workspace/training_demo
RUN mkdir -p annotations pre-trained-model training images/train images/test