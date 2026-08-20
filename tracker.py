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

def create_best_tracker():
    """
    Instancia o melhor rastreador disponivel no OpenCV instalado.
    """
    # 1. CSRT (melhor precisao)
    if hasattr(cv2, 'TrackerCSRT_create'):
        return cv2.TrackerCSRT_create()
    if hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerCSRT_create'):
        return cv2.legacy.TrackerCSRT_create()

    # 2. MIL (nativo no OpenCV 5.0)
    if hasattr(cv2, 'TrackerMIL_create'):
        return cv2.TrackerMIL_create()
    if hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerMIL_create'):
        return cv2.legacy.TrackerMIL_create()

    # 3. KCF
    if hasattr(cv2, 'TrackerKCF_create'):
        return cv2.TrackerKCF_create()
    if hasattr(cv2, 'legacy') and hasattr(cv2.legacy, 'TrackerKCF_create'):
        return cv2.legacy.TrackerKCF_create()

    # 4. Nano
    if hasattr(cv2, 'TrackerNano_create'):
        return cv2.TrackerNano_create()

    return None

def fallback_template_tracking(cap, start_frame, max_frames, init_bbox, frame_w, frame_h, fps):
    """
    Algoritmo de rastreio de suporte por Template Matching + Color Hist,
    garantindo que NUNCA falha mesmo se o OpenCV nao tiver módulos C++ de tracking.
    """
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    ret, frame = cap.read()
    if not ret:
        return []

    bx, by, bw, bh = init_bbox
    template = frame[by:by+bh, bx:bx+bw]
    if template.size == 0:
        return []

    trajectory = [{
        "frame": 0, "time": 0.0,
        "x": round((bx + bw / 2.0) / frame_w, 4),
        "y": round((by + bh) / frame_h, 4),
        "w": round(bw / frame_w, 4),
        "h": round(bh / frame_h, 4)
    }]

    last_cx, last_cy = bx + bw / 2.0, by + bh
    search_margin = int(max(bw, bh) * 1.8)

    frame_count = 0
    while cap.isOpened() and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        frame_count += 1
        # Search region around last known position
        sx1 = max(0, int(last_cx - bw / 2.0 - search_margin))
        sy1 = max(0, int(last_cy - bh - search_margin))
        sx2 = min(frame_w, int(last_cx + bw / 2.0 + search_margin))
        sy2 = min(frame_h, int(last_cy + search_margin))

        search_roi = frame[sy1:sy2, sx1:sx2]
        if search_roi.shape[0] < bh or search_roi.shape[1] < bw:
            break

        res = cv2.matchTemplate(search_roi, template, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(res)

        if max_val > 0.35:
            new_bx = sx1 + max_loc[0]
            new_by = sy1 + max_loc[1]
            cx = new_bx + bw / 2.0
            cy = new_by + bh
            last_cx, last_cy = cx, cy

            trajectory.append({
                "frame": frame_count,
                "time": round(frame_count / fps, 3),
                "x": round(cx / frame_w, 4),
                "y": round(cy / frame_h, 4),
                "w": round(bw / frame_w, 4),
                "h": round(bh / frame_h, 4)
            })
        else:
            break

    return trajectory

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
    ret, frame = cap.read()
    if not ret or frame is None:
        print(json.dumps({"error": "Não foi possível ler a imagem do vídeo"}))
        return

    frame_h, frame_w = frame.shape[:2]

    bx = int(bbox['x'] * frame_w)
    by = int(bbox['y'] * frame_h)
    bw = int(bbox['w'] * frame_w)
    bh = int(bbox['h'] * frame_h)

    bx = max(0, min(bx, frame_w - 10))
    by = max(0, min(by, frame_h - 10))
    bw = max(10, min(bw, frame_w - bx))
    bh = max(10, min(bh, frame_h - by))

    init_bbox = (bx, by, bw, bh)
    tracker = create_best_tracker()

    trajectory = []

    if tracker is not None:
        try:
            tracker.init(frame, init_bbox)
            last_center_x = bx + bw / 2.0
            last_center_y = by + bh
            max_jump_pixels = max(frame_w, frame_h) * 0.08

            trajectory.append({
                "frame": 0, "time": 0.0,
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
                    cy = y + h

                    dist_moved = np.hypot(cx - last_center_x, cy - last_center_y)
                    if dist_moved > max_jump_pixels:
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
                    break
        except Exception as e:
            trajectory = []

    # If OpenCV C++ tracker is not available or failed, use internal template tracker
    if len(trajectory) < 2:
        trajectory = fallback_template_tracking(cap, start_frame, max_frames, init_bbox, frame_w, frame_h, fps)

    cap.release()

    if len(trajectory) == 0:
        print(json.dumps({"error": "Não foi possível rastrear o jogador"}))
        return

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
