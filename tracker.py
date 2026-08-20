import sys
import json
import cv2

def track_player(video_path, start_time_sec, duration_sec, bbox):
    """
    Rastreia um jogador usando OpenCV.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(json.dumps({"error": f"Não foi possível abrir o vídeo: {video_path}"}))
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    start_frame = int(start_time_sec * fps)
    max_frames = int(duration_sec * fps)

    if start_frame >= total_frames:
        print(json.dumps({"error": "Tempo inicial excede a duração do vídeo"}))
        return

    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    ret, frame = cap.read()
    if not ret or frame is None:
        print(json.dumps({"error": "Não foi possível ler a imagem do vídeo"}))
        return

    # Fix: Get frame dimensions correctly
    frame_h, frame_w = frame.shape[:2]

    # Convert bbox from normalized [0..1] to pixel coords [x, y, w, h]
    bx = int(bbox['x'] * frame_w)
    by = int(bbox['y'] * frame_h)
    bw = int(bbox['w'] * frame_w)
    bh = int(bbox['h'] * frame_h)

    # Ensure valid bounding box within frame bounds
    bx = max(0, min(bx, frame_w - 10))
    by = max(0, min(by, frame_h - 10))
    bw = max(10, min(bw, frame_w - bx))
    bh = max(10, min(bh, frame_h - by))

    init_bbox = (bx, by, bw, bh)

    # Create OpenCV Tracker with robust fallbacks
    tracker = None

    # Try CSRT Tracker
    if hasattr(cv2, 'TrackerCSRT_create'):
        tracker = cv2.TrackerCSRT_create()
    elif hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerCSRT_create'):
        tracker = cv2.legacy.TrackerCSRT_create()

    # Fallback to KCF Tracker
    if tracker is None:
        if hasattr(cv2, 'TrackerKCF_create'):
            tracker = cv2.TrackerKCF_create()
        elif hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerKCF_create'):
            tracker = cv2.legacy.TrackerKCF_create()

    # Fallback to MIL Tracker
    if tracker is None:
        if hasattr(cv2, 'TrackerMIL_create'):
            tracker = cv2.TrackerMIL_create()
        elif hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerMIL_create'):
            tracker = cv2.legacy.TrackerMIL_create()

    if tracker is None:
        print(json.dumps({"error": "Nenhum rastreador OpenCV suportado foi encontrado"}))
        return

    try:
        tracker.init(frame, init_bbox)
    except Exception as e:
        print(json.dumps({"error": f"Falha ao iniciar o rastreador: {str(e)}"}))
        return

    trajectory = []
    # Add initial frame position (bottom center of bbox = player feet)
    trajectory.append({
        "frame": 0,
        "time": 0.0,
        "x": round((bx + bw / 2.0) / frame_w, 4),
        "y": round((by + bh) / frame_h, 4),
        "w": round(bw / frame_w, 4),
        "h": round(bh / frame_h, 4)
    })

    frame_count = 0
    while cap.isOpened() and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        frame_count += 1
        try:
            success, box = tracker.update(frame)
        except Exception:
            success = False

        if success and box is not None:
            x, y, w, h = [float(v) for v in box]
            cx = (x + w / 2.0) / frame_w
            cy = (y + h) / frame_h  # Feet position
            trajectory.append({
                "frame": frame_count,
                "time": round(frame_count / fps, 3),
                "x": round(cx, 4),
                "y": round(cy, 4),
                "w": round(w / frame_w, 4),
                "h": round(h / frame_h, 4)
            })
        else:
            # Player lost or out of bounds
            break

    cap.release()

    if len(trajectory) == 0:
        print(json.dumps({"error": "Não foi possível detetar o movimento"}))
        return

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
