#Modified model training from:
# https://github.com/UzmaSayyeda/Pill-Identifier/tree/main

import pandas as pd
import os
import json

import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import random
import matplotlib.pyplot as plt

import tensorflow as tf
from tensorflow import keras

import splitfolders
from tensorflow.keras.preprocessing import image
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from tensorflow.keras import layers
from tensorflow.keras.models import Sequential
from tensorflow.keras.applications import MobileNet

from tensorflow.keras.layers import Dense, GlobalAveragePooling2D

#Directories for training data (Windows)
# local_drug_directory = 'ml\\models\\local_drug_directory'
# train_dir = "ml\\models\\output\\train"
# valid_dir = "ml\\models\\output\\val"

# Directories for training data (macOS style)
local_drug_directory = '../ml/models/local_drug_directory'
train_dir = '../ml/models/output/train'
valid_dir = '../ml/models/output/val'


#Preprocess
img_height = 224
img_width = 224
batch_size = 1

#ImageDataGenerator is a tensorflow function to
#automatically generate batches of augmented images during model training
train_datagen = ImageDataGenerator(rescale=1./255)
valid_datagen = ImageDataGenerator(rescale=1./255)

# using ImageDataGenerator and flow_from_directory to preprocess the images
train_generator = train_datagen.flow_from_directory(train_dir,
                                                    target_size=(img_width,img_height),
                                                    batch_size=batch_size,
                                                    shuffle=True,
                                                    class_mode="categorical"
                                                   )

validation_generator = valid_datagen.flow_from_directory(valid_dir,
                                                    target_size=(img_width,img_height),
                                                    batch_size=batch_size,
                                                    shuffle=True,
                                                    class_mode="categorical"
                                                   )

# Extract class names for labeling
class_names = train_generator.class_indices.keys()
class_names

sample_names = []
training_samples = []

[training_samples.append(list(train_generator.classes).count(x)) for x in range(0,23)]

# Get only drug name, not dosage
for x in list(class_names):
    drug = x.split()[0]
    
    if drug == x:
        drug = x.split(sep = '_')[0]
        
    if drug == x:
        drug = x.split(sep = '-')[0]
    
    sample_names.append(drug.capitalize())


training_sample_size = pd.DataFrame({'Drug Name': sample_names,
                                    'count': training_samples})
training_sample_size

def show_sample_images(local_directory):
    # Go into the local directory and put all subdirectories in a List
    subdirectories = [d for d in os.listdir(local_directory) if os.path.isdir(os.path.join(local_directory, d))]

    # Check if there are any subdirectories
    if not subdirectories:
        print("No subdirectories found in the directory.")
        return

    # Collect all image files from all subdirectories
    all_image_files = []
    for subdirectory in subdirectories:
        subdirectory_path = os.path.join(local_directory, subdirectory)

        # List all image files in the subdirectory
        image_files = [f for f in os.listdir(subdirectory_path) if f.lower().endswith(('.jpg', '.jpeg'))]

        # Add the image files to the combined list
        all_image_files.extend(os.path.join(subdirectory_path, f) for f in image_files)

    # Shuffle the combined list of image files
    random.shuffle(all_image_files)

    # Set the number of random images to display
    num_images_to_display = 5

    # Create subplots to display images side by side
    fig, axes = plt.subplots(1, num_images_to_display, figsize=(15, 3))  # Adjust figsize as needed

    # Loop to select and display 5 random images
    for i in range(num_images_to_display):
        # Check if there are still image files available
        if not all_image_files:
            break

        # Pop a random image from the combined list
        random_image_file = all_image_files.pop()

        # Load and display the randomly selected image
        img = mpimg.imread(random_image_file)

        # Display the image in the subplot
        axes[i].imshow(img)
        axes[i].axis('off')  # Turn off axis labels

    # Show the subplots
    plt.show()

# Example usage
show_sample_images(local_drug_directory)

# define a base model with non trainable params
base_model = MobileNet(weights = 'imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False
base_model.summary()

# set up our model and layers
model = Sequential()

model.add(base_model)
model.add(GlobalAveragePooling2D())
model.add(Dense(23, activation="softmax"))
model.summary()

# compile the model
model.compile(optimizer='adam',
              loss="categorical_crossentropy",
              metrics=['accuracy'])

# fit the model
model_fitted = model.fit(train_generator,
                         epochs=2,
                         validation_data = validation_generator)

# display training loss and training accuracy
model_loss, model_accuracy = model.evaluate(validation_generator, verbose=2)
print(f" loss : {model_loss}, accuracy : {model_accuracy}")

# Visualize the training and validation accuracy
plt.plot(model_fitted.history['accuracy'], label='Train Accuracy')
plt.plot(model_fitted.history['val_accuracy'], label='Validation Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.grid(True)
plt.title('Training and Validation Accuracy')

plt.show()

plt.plot(model_fitted.history['loss'], label='Train Loss')
plt.plot(model_fitted.history['val_loss'], label='Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid(True)
plt.title('Training and Validation Loss')
plt.show()

# Save class names in the order they appear in training
class_names = list(dict(sorted(train_generator.class_indices.items(), key=lambda item: item[1])).keys())

# Save to JSON to easily be included in the pillDetection.py script
with open("class_names.json", "w") as f:
    json.dump(class_names, f)

print("Class names saved to class_names.json")

# save the model to be loaded in pillDetection.py
model.save('../MobileNet.keras')