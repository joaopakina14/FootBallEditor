import sys
import json
import cv2
import numpy as np

def smooth_trajectory(trajectory, window_size=5):
    """
    Aplica um filtro de media movel para eliminar o treme-treme (jittering)
    e fazer o movimento deslizar suavemente.
    """
    if len(trajectory) < window_size:
        return trajectory

    xs = [p['x'] for p in trajectory]
    ys = [p['y'] for p in trajectory]
    ws = [p['w'] for p in trajectory]
    hs = [p['h'] for p in trajectory]

    # Moving average filter
    kernel = np.ones(window_size) / window_size
    smoothed_xs = np.convolve(xs, kernel, mode='same')
    smoothed_ys = np.convolve(ys, kernel, mode='same')
    smoothed_ws = np.convolve(ws, kernel, mode='same')
    smoothed_hs = np.convolve(hs, kernel, mode='same')

    # Keep initial points exact
    pad = window_size // 2
    for i in range(len(trajectory)):
        if i >= pad and i < len(trajectory) - pad:
            trajectory[i]['x'] = round(float(smoothed_xs[i]), 4)
            trajectory[i]['y'] = round(float(smoothed_ys[i]), 4)
            trajectory[i]['w'] = round(float(smoothed_ws[i]), 4)
            trajectory[i]['h'] = round(float(smoothed_hs[i]), 4)

    return trajectory

def refine_bbox_player_silhouete(frame, bx, by, bw, bh):
    """
    Remove o verde do relvado dentro da caixa selecionada para focar
    exclusivamente no corpo/equipamento do jogador.
    """
    h, w = frame.shape[:2]
    roi = frame[by:by+bh, bx:bx+bw]
    if roi.size == 0:
        return bx, by, bw, bh

    # Convert to HSV to detect grass
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    # Green grass range in HSV
    lower_green = np.array([30, 40, 40])
    upper_green = np.array([85, 255, 255])
    grass_mask = cv2.inRange(hsv, lower_green, upper_green)

    # Player mask is the non-grass pixels
    player_mask = cv2.bitwise_not(grass_mask)

    # Find contours of non-grass objects inside ROI
    contours, _ = cv2.findContours(player_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        # Get bounding box of all non-grass contours combined
        all_pts = np.vstack([c for c in contours if cv2.contourArea(c) > 10])
        if len(all_pts) > 0:
            rx, ry, rw, rh = cv2.boundingRect(all_pts)
            # Refine initial box to player bounds inside ROI
            new_bx = max(0, min(w - 10, bx + rx))
            new_by = max(0, min(h - 10, by + ry))
            new_bw = max(10, min(w - new_bx, rw))
            new_bh = max(10, min(h - new_by, rh))
            return new_bx, new_by, new_bw, new_bh

    return bx, by, bw, bh

def track_player(video_path, start_time_sec, duration_sec, bbox):
    """
    Rastreia um jogador com alta velocidade, sem tremer e sem perder o foco.
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

    frame_h, frame_w = frame.shape[:2]

    # Convert bbox from normalized [0..1] to pixel coords [x, y, w, h]
    bx = int(bbox['x'] * frame_w)
    by = int(bbox['y'] * frame_h)
    bw = int(bbox['w'] * frame_w)
    bh = int(bbox['h'] * frame_h)

    bx = max(0, min(bx, frame_w - 10))
    by = max(0, min(by, frame_h - 10))
    bw = max(10, min(bw, frame_w - bx))
    bh = max(10, min(bh, frame_h - by))

    # Refine initial bbox to lock onto player silhouette (filtering grass out)
    bx, by, bw, bh = refine_bbox_player_silhouete(frame, bx, by, bw, bh)
    init_bbox = (bx, by, bw, bh)

    # Use CSRT Tracker (best for occlusion resistance and precision)
    tracker = None
    if hasattr(cv2, 'TrackerCSRT_create'):
        tracker = cv2.TrackerCSRT_create()
    elif hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerCSRT_create'):
        tracker = cv2.legacy.TrackerCSRT_create()

    if tracker is None:
        if hasattr(cv2, 'TrackerKCF_create'):
            tracker = cv2.TrackerKCF_create()
        elif hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerKCF_create'):
            tracker = cv2.legacy.TrackerKCF_create()

    if tracker is None:
        print(json.dumps({"error": "Nenhum rastreador OpenCV foi encontrado"}))
        return

    try:
        tracker.init(frame, init_bbox)
    except Exception as e:
        print(json.dumps({"error": f"Falha ao iniciar o rastreador: {str(e)}"}))
        return

    trajectory = []
    last_center_x = bx + bw / 2.0
    last_center_y = by + bh
    max_jump_pixels = max(frame_w, frame_h) * 0.08  # Max physical movement per frame (~8% screen width)

    trajectory.append({
        "frame": 0,
        "time": 0.0,
        "x": round(last_center_x / frame_w, 4),
        "y": round(last_center_y / frame_h, 4),
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
            cx = x + w / 2.0
            cy = y + h  # Feet location

            # Physical motion check: Reject sudden jumps to other players
            dist_moved = np.hypot(cx - last_center_x, cy - last_center_y)
            if dist_moved > max_jump_pixels:
                # Discard jump to distant player, continue inertia
                cx = last_center_x
                cy = last_center_y
            else:
                last_center_x = cx
                last_center_y = cy

            trajectory.append({
                "frame": frame_count,
                "time": round(frame_count / fps, 3),
                "x": round(cx / frame_w, 4),
                "y": round(cy / frame_h, 4),
                "w": round(w / frame_w, 4),
                "h": round(h / frame_h, 4)
            })
        else:
            # End tracking if player lost completely
            break

    cap.release()

    if len(trajectory) == 0:
        print(json.dumps({"error": "Não foi possível detetar o movimento do jogador"}))
        return

    # Apply moving average filter to remove all jittering and make motion ultra smooth
    trajectory = smooth_trajectory(trajectory, window_size=5)

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
