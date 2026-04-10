# Kayla's Python Script
import cv2
import mediapipe as mp
import numpy as np
import json
from datetime import datetime, timedelta

# Setup MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)

# Video source
cap = cv2.VideoCapture(0)

# State
prev_gray = None
swallow_events = []
frame_count = 0
last_event_time = None
cooldown_seconds = 2

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.resize(frame, (640, 480))
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    results = face_mesh.process(rgb)

    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0]
        h, w, _ = frame.shape

        # Mouth status detection
        top_lip = landmarks.landmark[13].y
        bottom_lip = landmarks.landmark[14].y
        mouth_gap = abs(bottom_lip - top_lip)

        # Skip if mouth is too open
        if mouth_gap > 0.02:
            print(f"Frame {frame_count}: Mouth open — skipping")
            prev_gray = gray.copy()
            frame_count += 1
            continue

        # Throat region
        throat_indices = [14, 152, 164, 378, 200, 427, 411]
        throat_points = [(int(landmarks.landmark[i].x * w), int(landmarks.landmark[i].y * h)) for i in throat_indices]
        throat_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(throat_mask, [np.array(throat_points, dtype=np.int32)], 255)

        # Forehead region
        forehead_indices = [70, 63, 105, 66, 107, 336, 296, 334, 293, 276]
        forehead_points = [(int(landmarks.landmark[i].x * w), int(landmarks.landmark[i].y * h)) for i in forehead_indices]
        forehead_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(forehead_mask, [np.array(forehead_points, dtype=np.int32)], 255)

        if prev_gray is not None:
            
            flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None,
                                                pyr_scale=0.5, levels=3, winsize=15,
                                                iterations=3, poly_n=5, poly_sigma=1.2, flags=0)

            flow_y = flow[..., 1]  

            throat_motion = np.mean(np.abs(flow_y[throat_mask.astype(bool)]))
            forehead_motion = np.mean(np.abs(flow_y[forehead_mask.astype(bool)]))

            print(f"Frame {frame_count}: Throat={throat_motion:.3f}, Forehead={forehead_motion:.3f}, Mouth gap={mouth_gap:.4f}")

            # Swallow detection
            if throat_motion > 2.8 and forehead_motion > 1.0:
                now = datetime.now()
                if not last_event_time or (now - last_event_time) > timedelta(seconds=cooldown_seconds):
                    timestamp = now.isoformat()
                    print(f"🫗 Swallow detected at frame {frame_count} ({timestamp})")
                    swallow_events.append({
                        "frame": int(frame_count),
                        "timestamp": timestamp,
                        "v_flow_throat": float(throat_motion),
                        "v_flow_forehead": float(forehead_motion),
                        "mouth_gap": float(mouth_gap)
                    })
                    last_event_time = now

        prev_gray = gray.copy()

    cv2.imshow("Swallow Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    frame_count += 1

cap.release()
cv2.destroyAllWindows()

# Save events to JSON
with open("backend/swallowDetectionJson.json", "w") as f:
    json.dump(swallow_events, f, indent=2)

print("Swallow events saved to 'swallowDetectionJson.json'")





