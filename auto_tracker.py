import sys
import json
import cv2
import numpy as np

def run_auto_tracker(video_path, start_time_sec, duration_sec):
    try:
        from ultralytics import YOLO
    except ImportError:
        print(json.dumps({"error": "Ultralytics YOLO não está instalado."}))
        return

    # Initialize YOLOv8n (nano version for speed)
    try:
        model = YOLO('yolov8n.pt')
    except Exception as e:
        print(json.dumps({"error": f"Erro ao carregar modelo YOLO: {str(e)}"}))
        return

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(json.dumps({"error": f"Não foi possível abrir o vídeo: {video_path}"}))
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0: fps = 30.0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    start_frame = int(start_time_sec * fps)
    max_frames = int(duration_sec * fps)

    if start_frame >= total_frames:
        print(json.dumps({"error": "Tempo inicial excede a duração do vídeo"}))
        return

    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    
    # Tracking data structure: { track_id: [ {frame, time, x, y, w, h} ] }
    trajectories = {}
    camera_pans = []

    work_w = 640
    prev_gray_top = None
    cum_pan = 0.0

    frame_count = 0
    while cap.isOpened() and frame_count < max_frames:
        ret, raw_frame = cap.read()
        if not ret or raw_frame is None:
            break

        orig_h, orig_w = raw_frame.shape[:2]
        scale = work_w / float(orig_w)
        work_h = int(orig_h * scale)
        frame = cv2.resize(raw_frame, (work_w, work_h), interpolation=cv2.INTER_LINEAR)

        # ── Camera Pan Estimation using Background Motion ──
        # Take the upper 30% of the frame (crowd / stands / advertising) to track camera rotation
        top_slice = frame[0:int(work_h * 0.35), :]
        gray_top = cv2.cvtColor(top_slice, cv2.COLOR_BGR2GRAY)

        if prev_gray_top is not None:
            # Phase correlation for fast and robust subpixel camera shift
            shift, _ = cv2.phaseCorrelate(prev_gray_top.astype(np.float32), gray_top.astype(np.float32))
            dx, dy = shift
            # In phase correlation, positive shift means image moved right (camera panned left)
            if abs(dx) < (work_w * 0.15): # filter out sudden scene cuts
                cum_pan -= float(dx / float(work_w))

        prev_gray_top = gray_top
        cur_time = round(frame_count / fps, 3)
        camera_pans.append({
            "time": cur_time,
            "pan": round(cum_pan, 4)
        })

        # ── Run YOLO tracking ──
        results = model.track(frame, persist=True, classes=0, conf=0.15, verbose=False)
        
        if results[0].boxes.id is not None:
            boxes = results[0].boxes.xywhn.cpu().tolist() # Normalized coordinates (0-1)
            track_ids = results[0].boxes.id.int().cpu().tolist()
            
            for box, track_id in zip(boxes, track_ids):
                cx, cy, bw, bh = box
                bottom_y = float(cy + bh / 2.0)
                
                norm_x = float(round(cx, 4))
                norm_y = float(round(bottom_y, 4))
                norm_w = float(round(bw, 4))
                norm_h = float(round(bh, 4))
                
                if track_id not in trajectories:
                    trajectories[track_id] = []
                    
                trajectories[track_id].append({
                    "frame": frame_count,
                    "time": cur_time,
                    "x": norm_x,
                    "y": norm_y,
                    "w": norm_w,
                    "h": norm_h
                })

        frame_count += 1
        
        # Report progress
        if frame_count % 3 == 0 or frame_count == max_frames:
            progress = int((frame_count / max_frames) * 100)
            print(json.dumps({"progress": progress}))
            sys.stdout.flush()

    cap.release()
    
    # Filter out very short trajectories (e.g. spurious detections)
    min_length = fps * 0.5
    filtered_trajectories = [traj for traj in trajectories.values() if len(traj) >= min_length]

    print(json.dumps({
        "success": True,
        "fps": fps,
        "totalPlayers": len(filtered_trajectories),
        "trajectories": filtered_trajectories,
        "cameraPans": camera_pans
    }))

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: python auto_tracker.py <video_path> <start_sec> <duration_sec>"}))
        sys.exit(1)

    v_path = sys.argv[1]
    st_sec = float(sys.argv[2])
    dur_sec = float(sys.argv[3])

    run_auto_tracker(v_path, st_sec, dur_sec)
