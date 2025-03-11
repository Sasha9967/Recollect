import os
import random
import time
import cv2
from flask import Flask, jsonify, request, send_file, render_template, send_from_directory
from flask_cors import CORS
from datetime import datetime
from threading import Thread
import subprocess
import stat

# Get base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Points to backend/
PROJECT_DIR = os.path.dirname(BASE_DIR)  # Moves up to the root (where frontend/ is)

# Set up correct paths
RECORDINGS_FOLDER = os.path.join(BASE_DIR, "recordings")
RESPONSES_FOLDER = os.path.join(BASE_DIR, "responses")
FRONTEND_FOLDER = os.path.join(PROJECT_DIR, "frontend")  # Moves up one level to locate frontend/

STATIC_FOLDER = os.path.join(FRONTEND_FOLDER, "static")

# Ensure necessary directories exist
os.makedirs(RECORDINGS_FOLDER, exist_ok=True)
os.makedirs(RESPONSES_FOLDER, exist_ok=True)

os.chmod(RECORDINGS_FOLDER, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)

# Flask app setup with corrected paths
app = Flask(
    __name__, 
    template_folder=FRONTEND_FOLDER,  
    static_folder=STATIC_FOLDER
)

CORS(app)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/recording')
def recording():
    return render_template("recording.html")

@app.route('/game')
def game():
    return render_template("gameHome.html")

@app.route('/play')
def play_game():
    return send_from_directory(app.static_folder, "playGame.html")


# Recording state flags
is_recording = False  
stop_requested = False  

### --- CAMERA RECORDING ROUTES --- ###
def try_open_camera(rtsp_url, timeout=5):
    video = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    video.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduces buffering
    video.set(cv2.CAP_PROP_FPS, 20)  # Adjust FPS to match camera
    video.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Lower resolution for faster speed
    video.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    start_time = time.time()
    while not video.isOpened():
        if time.time() - start_time > timeout:
            print("Camera connection timeout!")
            return None
    return video

@app.route('/record', methods=['POST'])
def start_recording():
    """Starts video recording from RTSP camera."""
    global is_recording, stop_requested
    
    if is_recording:
        print("⚠️ Already recording! Rejecting new request.")
        return jsonify({"message": "Recording is already in progress"}), 400

    # ✅ Ensure camera is accessible before starting recording
    rtsp_url = "rtsp://192.168.188.1/172FE627972B8FA0D41A96318A50EDBE&0"
    video = try_open_camera(rtsp_url, timeout=10)

    if video is None:
        return jsonify({"error": "Failed to connect to camera"}), 500

    stop_requested = False  
    is_recording = True  

    # ✅ Start the recording in a separate thread
    thread = Thread(target=record_video, args=(rtsp_url,))
    thread.daemon = True
    thread.start()

    print("🎥 Recording started...")
    return jsonify({"message": "Recording started"}), 200

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    """Stops video recording."""
    global stop_requested
    if not is_recording:
        return jsonify({"message": "No active recording to stop"}), 400

    stop_requested = True  
    return jsonify({"message": "Recording will be stopped"}), 200

def record_video(rtsp_url):
    """Handles video recording."""
    global is_recording, stop_requested
    is_recording = True

    timestamp = time.strftime("%Y-%m-%d-%H-%M-%S")
    temp_avi_file = os.path.join(RECORDINGS_FOLDER, f"{timestamp}.avi")  # Temporary file
    output_mp4_file = os.path.join(RECORDINGS_FOLDER, f"{timestamp}.mp4")  # Final MP4 output

    video = cv2.VideoCapture(rtsp_url)
    if not video.isOpened():
        is_recording = False
        return

    frame_width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = 8
    fourcc = cv2.VideoWriter_fourcc(*"MJPG")
    out = cv2.VideoWriter(temp_avi_file, fourcc, fps, (frame_width, frame_height))

    start_time = time.time()
    timeout = 10  

    while (time.time() - start_time) < timeout:
        if stop_requested:  
            break

        success, frame = video.read()
        if not success:
            break

        out.write(frame)
        time.sleep(1 / fps)

    video.release()
    out.release()
    cv2.destroyAllWindows()
    is_recording = False
    print(f"Recording saved as '{temp_avi_file}'")

    ffmpeg_cmd = f"ffmpeg -y -i {temp_avi_file} -vcodec libx264 {output_mp4_file}"
    subprocess.run(ffmpeg_cmd, shell=True, check=True)

    print(f"🎥 Converted to MP4: '{output_mp4_file}'")

    # ✅ Delete the temporary AVI file
    os.remove(temp_avi_file)
    print(f"🗑️ Deleted temporary file: '{temp_avi_file}'")

### --- GAME MANAGEMENT ROUTES --- ###
@app.route('/start_game', methods=['GET'])
def start_game():
    print("Checking recordings folder:", RECORDINGS_FOLDER)

    """Randomly selects a date and returns associated videos."""
    if not os.path.exists(RECORDINGS_FOLDER):
        return jsonify({"error": "Recordings folder not found"}), 404

    video_files = [f for f in os.listdir(RECORDINGS_FOLDER) if f.endswith(".mp4")]
    if not video_files:
        return jsonify({"error": "No video files found"}), 404
    
    print("Available video files:", video_files)

    unique_dates = set()
    valid_videos = []

    for video in video_files:
        try:
            parts = video.replace(".mp4", "").split('-')
            if len(parts) == 6:
                date_part = f"{parts[0]}-{parts[1]}-{parts[2]}"
                time_part = f"{parts[3]}:{parts[4]}:{parts[5]}"
                datetime.strptime(date_part, "%Y-%m-%d")
                datetime.strptime(time_part, "%H:%M:%S")
                unique_dates.add(date_part)
                valid_videos.append(video)
        except ValueError:
            continue
    
    print("Unique dates:", unique_dates)
    print("Valid videos:", valid_videos)
    

    if not unique_dates:
        return jsonify({"error": "No valid event dates found"}), 404

    selected_date = random.choice(list(unique_dates))

    print("Selected date:", selected_date)

    videos_for_date = [f for f in valid_videos if f.startswith(selected_date)]

    print("Videos for selected date:", videos_for_date)

    time_ranges = sorted([f"{f.split('-')[3]}:{f.split('-')[4]}:{f.split('-')[5].replace('.mp4', '')}" for f in videos_for_date])

    return jsonify({"selected_date": selected_date, "videos": videos_for_date, "time_ranges": time_ranges})


@app.route('/play/<filename>', methods=['GET'])
def play_video(filename):
    """Serve the video file."""
    file_path = os.path.join(RECORDINGS_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=False)
    else:
        return jsonify({"error": "File not found"}), 404
    


@app.route('/submit_all_responses', methods=['POST'])
def submit_all_responses():
    """Saves all responses from a game session into one file."""
    data = request.json  

    if not data or "session_id" not in data or "responses" not in data:
        return jsonify({"error": "Invalid data format"}), 400

    session_id = data["session_id"]
    responses = data["responses"]

    if not isinstance(responses, list) or len(responses) == 0:
        return jsonify({"error": "No responses provided"}), 400

    # ✅ Format and write responses to a single file
    response_filename = f"{session_id}.txt"
    response_filepath = os.path.join(RESPONSES_FOLDER, response_filename)

    with open(response_filepath, 'w') as file:
        for response in responses:
            file.write(f"Selected Date: {response['selected_date']}\n")
            file.write(f"Selected Time: {response['selected_time']}\n")
            file.write(f"Selected Video: {response['selected_video']}\n\n")

    return jsonify({"message": "Responses saved successfully", "file": response_filepath})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
