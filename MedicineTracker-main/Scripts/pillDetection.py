import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import os
import argparse

# Load the trained model from pillDetectionModelTraining.py
model_path = "../MobileNet.keras"
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Trained model not found at: {model_path}")

model = load_model(model_path)
print("Model Loaded Successfully")

# Add class names from class_names.json
class_names = [
    'Amoxicillin 500 mg', 'Apixaban 2.5 mg', 'Aprepitant 80 mg', 'Atomoxetine 25 mg', 
    'Calcitriol 0.00025', 'Doxycycline HYC 100 mg', 'Doxycycline MONO 100 mg', 'Prasugrel 10 MG', 
    'Ramipril 5 MG', 'Saxagliptin 5 MG', 'Sitagliptin 50 MG', 'carvedilol 3.125', 'celecoxib 200', 
    'duloxetine 30', 'eltrombopag 25', 'metformin_500', 'montelukast-10', 'mycophenolate-250', 
    'omeprazole_40', 'oseltamivir-45', 'pantaprazole-40', 'pitavastatin_1', 
    'sertraline_25'
]

# Constants
IMG_WIDTH, IMG_HEIGHT = 224, 224
BOX_SIZE = 224  # Match model input size
BOX_COLOR = (0, 255, 0)
MASK_OPACITY = 0.7

def process_image(image_path):
    # Read the image
    frame = cv2.imread(image_path)
    if frame is None:
        raise ValueError(f"Could not read image at {image_path}")

    h, w, _ = frame.shape

    # Create a region of interest
    x1 = w // 2 - BOX_SIZE // 2
    y1 = h // 2 - BOX_SIZE // 2
    x2 = x1 + BOX_SIZE
    y2 = y1 + BOX_SIZE

    # Ensure the ROI is within image bounds
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w, x2)
    y2 = min(h, y2)

    roi = frame[y1:y2, x1:x2]
    img = cv2.resize(roi, (IMG_WIDTH, IMG_HEIGHT))
    img = img_to_array(img) / 255.0
    img = np.expand_dims(img, axis=0)

    preds = model.predict(img)
    class_index = np.argmax(preds[0])
    confidence = preds[0][class_index]
    label = f"{class_names[class_index]} ({confidence * 100:.1f}%)"

    return {
        'pill_name': class_names[class_index],
        'confidence': float(confidence * 100),
        'label': label
    }

def main():
    parser = argparse.ArgumentParser(description='Pill Detection')
    parser.add_argument('--image', type=str, help='Path to the image file')
    args = parser.parse_args()

    if args.image:
        # Process single image
        try:
            result = process_image(args.image)
            print(result['label'])
        except Exception as e:
            print(f"Error processing image: {str(e)}")
    else:
        # Webcam mode
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise Exception("Webcam not launched")

        print("Place the pill inside the green box for detection. Press 'q' to quit.")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            x1 = w // 2 - BOX_SIZE // 2
            y1 = h // 2 - BOX_SIZE // 2
            x2 = x1 + BOX_SIZE
            y2 = y1 + BOX_SIZE

            roi = frame[y1:y2, x1:x2]
            img = cv2.resize(roi, (IMG_WIDTH, IMG_HEIGHT))
            img = img_to_array(img) / 255.0
            img = np.expand_dims(img, axis=0)

            preds = model.predict(img)
            class_index = np.argmax(preds[0])
            confidence = preds[0][class_index]
            label = f"{class_names[class_index]} ({confidence * 100:.1f}%)"

            cv2.rectangle(frame, (x1, y1), (x2, y2), BOX_COLOR, 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, BOX_COLOR, 2)

            cv2.imshow("Pill Detector", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()