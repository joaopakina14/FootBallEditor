import sys
import json
import cv2

def track_player(video_path, start_time_sec, duration_sec, bbox):
    """
    Rastreia um jogador usando o algoritmo CSRT do OpenCV.
    bbox: [x, y, w, h] em coordenadas normalizadas (0.0 a 1.0) ou pixeis nativos do video
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(json.dumps({"error": f"Could not open video: {video_path}"}))
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    start_frame = int(start_time_sec * fps)
    max_frames = int(duration_sec * fps)

    if start_frame >= total_frames:
        print(json.dumps({"error": "Start time exceeds video length"}))
        return

    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    ret, frame = cap.read()
    if not ret or frame is None:
        print(json.dumps({"error": "Failed to read initial frame"}))
        return

    frame_h, frame_w = frame.shape[:0]
    frame_h, frame_w = frame.shape[0], frame.shape[1]

    # Convert bbox from normalized [0..1] to pixel coords [x, y, w, h]
    bx = int(bbox['x'] * frame_w)
    by = int(bbox['y'] * frame_h)
    bw = int(bbox['w'] * frame_w)
    bh = int(bbox['h'] * frame_h)

    # Ensure valid bounding box
    bx = max(0, min(bx, frame_w - 5))
    by = max(0, min(by, frame_h - 5))
    bw = max(5, min(bw, frame_w - bx))
    bh = max(5, min(bh, frame_h - by))

    init_bbox = (bx, by, bw, bh)

    # Initialize OpenCV CSRT Tracker (or Legacy Tracker depending on version)
    try:
        tracker = cv2.TrackerCSRT_create()
    except AttributeError:
        try:
            tracker = cv2.legacy.TrackerCSRT_create()
        except AttributeError:
            # Fallback to KCF if CSRT isn't directly available in current OpenCV build
            tracker = cv2.TrackerKCF_create()

    tracker.init(frame, init_bbox)

    trajectory = []
    # Add initial frame position
    trajectory.append({
        "frame": 0,
        "time": 0.0,
        "x": round((bx + bw / 2.0) / frame_w, 4),
        "y": round((by + bh) / frame_h, 4), # Feet position at bottom center
        "w": round(bw / frame_w, 4),
        "h": round(bh / frame_h, 4)
    })

    frame_count = 0
    while cap.isOpened() and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        frame_count += 1
        success, box = tracker.update(frame)

        if success:
            x, y, w, h = [float(v) for v in box]
            cx = (x + w / 2.0) / frame_w
            cy = (y + h) / frame_h # Spotting at feet
            trajectory.append({
                "frame": frame_count,
                "time": round(frame_count / fps, 3),
                "x": round(cx, 4),
                "y": round(cy, 4),
                "w": round(w / frame_w, 4),
                "h": round(h / frame_h, 4)
            })
        else:
            # Rastreio perdeu o objeto
            break

    cap.release()
    print(json.dumps({
        "success": True,
        "fps": fps,
        "totalPoints": len(trajectory),
        "trajectory": trajectory
    }))

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(json.dumps({"error": "Usage: python tracker.py <video_path> <start_sec> <duration_sec> <bbox_json>"}))
        sys.exit(1)

    v_path = sys.argv[1]
    st_sec = float(sys.argv[2])
    dur_sec = float(sys.argv[3])
    b_box = json.loads(sys.argv[4])

    track_player(v_path, st_sec, dur_sec, b_box)
