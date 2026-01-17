import cv2
import time
import requests
from collections import defaultdict, deque

from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

BACKEND_URL = "http://127.0.0.1:8000/cv/crowd"
DRIVER_ID = 1

CAPACITY = 18

# How often to send to backend (seconds)
SEND_EVERY_SEC = 2

# Detection / tracking tuning
CONF_THRES = 0.55
ACTIVE_TTL_FRAMES = 15
SMOOTH_WINDOW = 10

# Ignore tiny boxes to reduce false positives
MIN_BOX_AREA = 2000

# -------------------------
# Helpers
# -------------------------
def to_crowd_level(count: int, cap: int) -> str:
    """
    Map passenger count to your 3 labels:
    spacious / crowded / full
    Adjust thresholds as you like.
    """
    r = count / max(cap, 1)
    if r <= 0.55:
        return "spacious"
    if r <= 0.90:
        return "crowded"
    return "full"

def send_update(passenger_count: int):
    payload = {
        "driver_id": DRIVER_ID,
        "current_passenger_count": int(passenger_count),
        "crowd_level": to_crowd_level(int(passenger_count), CAPACITY),
    }
    try:
        requests.post(BACKEND_URL, json=payload, timeout=1.5)
    except requests.RequestException:
        pass

# -------------------------
# Model init
# -------------------------
model = YOLO("yolov8n.pt")

tracker = DeepSort(
    max_age=45,
    n_init=5,
    max_iou_distance=0.6
)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("Webcam not found. Try changing VideoCapture(0) to (1).")

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

frame_idx = 0
last_seen = defaultdict(int)      # track_id -> last seen frame index
count_hist = deque(maxlen=SMOOTH_WINDOW)
last_sent_time = 0.0

while True:
    frame_idx += 1
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, verbose=False)[0]

    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])

        # COCO class 0 = person
        if cls_id != 0 or conf < CONF_THRES:
            continue

        x1, y1, x2, y2 = box.xyxy[0].tolist()
        w, h = (x2 - x1), (y2 - y1)

        if MIN_BOX_AREA > 0 and (w * h) < MIN_BOX_AREA:
            continue

        detections.append(([x1, y1, w, h], conf, "person"))

    tracks = tracker.update_tracks(detections, frame=frame)

    for t in tracks:
        if not t.is_confirmed():
            continue

        last_seen[t.track_id] = frame_idx

        l, t_y, r, b = map(int, t.to_ltrb())
        cv2.rectangle(frame, (l, t_y), (r, b), (0, 255, 0), 2)
        cv2.putText(frame, f"ID {t.track_id}", (l, t_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # Active tracks only (prevents ghost IDs inflating count)
    active_ids = [
        tid for tid, last in last_seen.items()
        if (frame_idx - last) <= ACTIVE_TTL_FRAMES
    ]
    raw_count = len(active_ids)

    # Smooth the count
    count_hist.append(raw_count)
    smooth_count = round(sum(count_hist) / len(count_hist))

    level = to_crowd_level(smooth_count, CAPACITY)

    # Send update every N seconds (not per frame)
    now = time.time()
    if now - last_sent_time >= SEND_EVERY_SEC:
        send_update(smooth_count)
        last_sent_time = now

    cv2.putText(frame, f"People: {smooth_count} | Crowd: {level}",
                (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

    cv2.imshow("YOLO + DeepSORT (Webcam)", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()