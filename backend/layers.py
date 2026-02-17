#Custom L1 Layer module

import tensorflow as tf
from tensorflow.keras.layers import Layer  # type: ignore


#Custom L1 layer module from Notebook
class L1Dist(Layer):
    
    # Init method - inheritance
    def __init__(self, **kwargs):
        super().__init__()
       
    # Magic happens here - similarity calculation
    def call(self, inputs):
        input_embedding, validation_embedding =inputs
        return tf.math.abs(input_embedding - validation_embedding)