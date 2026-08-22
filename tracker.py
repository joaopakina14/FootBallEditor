import sys
import json
import cv2
import numpy as np

def smooth_trajectory(trajectory, window_size=5):
    """
    Filtro de media movel para eliminar o treme-treme.
    """
    if len(trajectory) < window_size:
        return trajectory

    xs = [p['x'] for p in trajectory]
    ys = [p['y'] for p in trajectory]
    ws = [p['w'] for p in trajectory]
    hs = [p['h'] for p in trajectory]

    kernel = np.ones(window_size) / window_size
    smoothed_xs = np.convolve(xs, kernel, mode='same')
    smoothed_ys = np.convolve(ys, kernel, mode='same')
    smoothed_ws = np.convolve(ws, kernel, mode='same')
    smoothed_hs = np.convolve(hs, kernel, mode='same')

    pad = window_size // 2
    for i in range(len(trajectory)):
        if i >= pad and i < len(trajectory) - pad:
            trajectory[i]['x'] = round(float(smoothed_xs[i]), 4)
            trajectory[i]['y'] = round(float(smoothed_ys[i]), 4)
            trajectory[i]['w'] = round(float(smoothed_ws[i]), 4)
            trajectory[i]['h'] = round(float(smoothed_hs[i]), 4)

    return trajectory

def get_grass_ratio(hsv_frame):
    """
    Calcula a percentagem de relvado verde presente no ecrã.
    """
    lower_green = np.array([30, 35, 35])
    upper_green = np.array([85, 255, 255])
    grass_mask = cv2.inRange(hsv_frame, lower_green, upper_green)
    return np.count_nonzero(grass_mask) / float(grass_mask.size)

def extract_kit_color_signature(frame_hsv, bx, by, bw, bh):
    """
    Extrai a assinatura de cor dominante do equipamento do jogador.
    """
    roi_hsv = frame_hsv[by:by+bh, bx:bx+bw]
    if roi_hsv.size == 0:
        return None

    lower_green = np.array([30, 35, 35])
    upper_green = np.array([85, 255, 255])
    grass_mask = cv2.inRange(roi_hsv, lower_green, upper_green)
    player_mask = cv2.bitwise_not(grass_mask)

    player_hsv = roi_hsv[player_mask > 0]
    if len(player_hsv) < 10:
        return None

    hist = cv2.calcHist([player_hsv], [0], None, [180], [0, 180])
    cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
    return hist

def verify_color_match(frame_hsv, bx, by, bw, bh, target_hist):
    """
    Compara a cor da camisola na nova posicao com a assinatura inicial.
    """
    if target_hist is None:
        return True

    h, w = frame_hsv.shape[:2]
    bx = max(0, min(bx, w - 10))
    by = max(0, min(by, h - 10))
    bw = max(10, min(bw, w - bx))
    bh = max(10, min(bh, h - by))

    curr_hist = extract_kit_color_signature(frame_hsv, bx, by, bw, bh)
    if curr_hist is None:
        return False

    score = cv2.compareHist(target_hist, curr_hist, cv2.HISTCMP_CORREL)
    return score > 0.12

def track_player(video_path, start_time_sec, duration_sec, bbox):
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
    ret, raw_frame = cap.read()
    if not ret or raw_frame is None:
        print(json.dumps({"error": "Não foi possível ler a imagem do vídeo"}))
        return

    orig_h, orig_w = raw_frame.shape[:2]

    # ⚡ Speed Optimization: Resize work frame to max 640px width
    work_w = 640
    scale = work_w / float(orig_w)
    work_h = int(orig_h * scale)
    frame = cv2.resize(raw_frame, (work_w, work_h), interpolation=cv2.INTER_LINEAR)
    frame_hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Initial pitch green ratio (e.g. 60% green)
    initial_green_ratio = get_grass_ratio(frame_hsv)

    # Scale initial bbox to work resolution
    bx = int(bbox['x'] * work_w)
    by = int(bbox['y'] * work_h)
    bw = int(bbox['w'] * work_w)
    bh = int(bbox['h'] * work_h)

    bx = max(0, min(bx, work_w - 10))
    by = max(0, min(by, work_h - 10))
    bw = max(10, min(bw, work_w - bx))
    bh = max(10, min(bh, work_h - by))

    init_bbox = (bx, by, bw, bh)

    # Extract kit color signature
    kit_hist = extract_kit_color_signature(frame_hsv, bx, by, bw, bh)

    # Create Tracker (CSRT preferred)
    tracker = None
    if hasattr(cv2, 'TrackerCSRT_create'):
        tracker = cv2.TrackerCSRT_create()
    elif hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerCSRT_create'):
        tracker = cv2.legacy.TrackerCSRT_create()

    if tracker is None and hasattr(cv2, 'TrackerMIL_create'):
        tracker = cv2.TrackerMIL_create()

    if tracker is None:
        print(json.dumps({"error": "Nenhum rastreador OpenCV suportado foi encontrado"}))
        return

    try:
        tracker.init(frame, init_bbox)
    except Exception as e:
        print(json.dumps({"error": f"Falha ao iniciar o rastreador: {str(e)}"}))
        return

    trajectory = []
    last_cx = bx + bw / 2.0
    last_cy = by + bh
    vx, vy = 0.0, 0.0
    max_jump_pixels = work_w * 0.07

    trajectory.append({
        "frame": 0, "time": 0.0,
        "x": round(last_cx / work_w, 4),
        "y": round(last_cy / work_h, 4),
        "w": round(bw / work_w, 4),
        "h": round(bh / work_h, 4)
    })

    color_mismatch_count = 0
    frame_count = 0

    while cap.isOpened() and frame_count < max_frames:
        ret, raw_frame = cap.read()
        if not ret or raw_frame is None:
            break

        frame_count += 1
        frame = cv2.resize(raw_frame, (work_w, work_h), interpolation=cv2.INTER_NEAREST)
        frame_hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # 📺 TV Camera Shot Cut Detection:
        # If green grass ratio drops significantly (e.g. cut to close-up player face/replay), STOP tracking immediately!
        curr_green_ratio = get_grass_ratio(frame_hsv)
        if initial_green_ratio > 0.25 and curr_green_ratio < 0.15:
            # Camera cut detected! Stop trajectory here so element vanishes clean
            break

        try:
            success, box = tracker.update(frame)
        except Exception:
            success = False

        if success and box is not None:
            x, y, w, h = [float(v) for v in box]
            
            # Stop tracking if the bounding box is mostly out of screen bounds
            overlap_x1 = max(0.0, x)
            overlap_y1 = max(0.0, y)
            overlap_x2 = min(float(work_w), x + w)
            overlap_y2 = min(float(work_h), y + h)

            overlap_w = max(0.0, overlap_x2 - overlap_x1)
            overlap_h = max(0.0, overlap_y2 - overlap_y1)
            overlap_area = overlap_w * overlap_h
            box_area = w * h

            if box_area <= 0 or (overlap_area / box_area) < 0.15:
                break

            cx = x + w / 2.0
            cy = y + h

            dist_moved = np.hypot(cx - last_cx, cy - last_cy)
            color_ok = verify_color_match(frame_hsv, int(x), int(y), int(w), int(h), kit_hist)

            if not color_ok:
                color_mismatch_count += 1
            else:
                color_mismatch_count = max(0, color_mismatch_count - 1)

            # If color mismatch persists for > 4 frames (lost player / shot cut), stop tracking!
            if color_mismatch_count > 4:
                break

            if dist_moved <= max_jump_pixels and color_ok:
                new_vx = cx - last_cx
                new_vy = cy - last_cy
                vx = 0.6 * vx + 0.4 * new_vx
                vy = 0.6 * vy + 0.4 * new_vy
                last_cx = cx
                last_cy = cy
            else:
                last_cx += vx
                last_cy += vy
                pred_bx = int(last_cx - bw / 2.0)
                pred_by = int(last_cy - bh)
                try:
                    tracker.init(frame, (pred_bx, pred_by, int(bw), int(bh)))
                except Exception:
                    pass

            trajectory.append({
                "frame": frame_count,
                "time": round(frame_count / fps, 3),
                "x": round(last_cx / work_w, 4),
                "y": round(last_cy / work_h, 4),
                "w": round(bw / work_w, 4),
                "h": round(bh / work_h, 4)
            })
        else:
            # End tracking if player completely lost or camera cut
            break

    cap.release()

    if len(trajectory) == 0:
        print(json.dumps({"error": "Não foi possível rastrear o jogador"}))
        return

    # Apply smoothing filter
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
