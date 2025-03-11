document.addEventListener("DOMContentLoaded", function () {
    const videoPlayer = document.getElementById("videoPlayer");
    const videoSource = document.getElementById("videoSource");
    const nextVideoBtn = document.getElementById("nextVideoBtn");

    if (!videoPlayer || !videoSource || !nextVideoBtn) {
        console.error("Error: Some video elements not found in playGame.html!");
        return;
    }

    let videoFiles = JSON.parse(sessionStorage.getItem("videoFiles")) || [];
    let responses = [];
    let currentVideoIndex = 0;
    let gameSessionID = `game_${new Date().toISOString().replace(/[-:.TZ]/g, "")}`; // Unique session ID

    console.log("Loaded video files from sessionStorage:", videoFiles); // ✅ Debugging

    if (videoFiles.length === 0) {
        console.error("No videos found in sessionStorage.");
        nextVideoBtn.textContent = "No videos available";
        nextVideoBtn.disabled = true;
        return;
    }

    function loadVideo(index) {
        if (index < videoFiles.length) {
            let videoURL = `http://192.168.188.199:5000/play/${videoFiles[index]}`;
            console.log("Loading video:", videoURL); // ✅ Debugging

            videoSource.src = videoURL;
            videoPlayer.load();

            if (index === videoFiles.length - 1) {
                nextVideoBtn.textContent = "Finish";
                nextVideoBtn.removeEventListener("click", nextVideo);
                nextVideoBtn.addEventListener("click", saveLastSelectionAndSubmit);
            }
        }
    }

    function saveCurrentSelection() {
        if (!window.selectedDate || !window.selectedTime) {
            alert("Please select a date and time before proceeding.");
            return false;
        }

        let selectedVideo = videoFiles[currentVideoIndex];

        let response = {
            selected_date: window.selectedDate.toISOString().split("T")[0], // ✅ Correct date format
            selected_time: window.selectedTime, // ✅ Correct time format
            selected_video: selectedVideo
        };

        responses.push(response);
        console.log("Response saved:", response);

        return true;
    }

    function clearScheduleSelection() {
        // ✅ Clears the blue highlight from previously selected time slots
        document.querySelectorAll(".time-slot.selected").forEach(cell => {
            cell.classList.remove("selected");
        });
    }

    function nextVideo() {
        if (!saveCurrentSelection()) {
            return;
        }

        // ✅ Clear the blue highlight in the schedule
        clearScheduleSelection();

        currentVideoIndex++;

        if (currentVideoIndex < videoFiles.length) {
            loadVideo(currentVideoIndex);
        } else {
            // ✅ If it's the last video, change button to submit all responses
            nextVideoBtn.removeEventListener("click", nextVideo);
            nextVideoBtn.addEventListener("click", saveLastSelectionAndSubmit);
        }
    }

    function saveLastSelectionAndSubmit() {
        if (!saveCurrentSelection()) {
            return;
        }

        console.log("Final responses array before submission:", responses);

        // ✅ Now submit all responses
        fetch("http://192.168.188.199:5000/submit_all_responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ session_id: gameSessionID, responses })
        })
        .then(response => response.json())
        .then(data => {
            console.log("All responses submitted successfully:", data);

            // ✅ Show success popup
            showSuccessPopup();
        })
        .catch(error => {
            console.error("Error submitting responses:", error);
        });
    }

    function showSuccessPopup() {
        let popup = document.createElement("div");
        popup.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: white; padding: 20px; border-radius: 10px; 
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2); text-align: center;">
                <h2>Responses Submitted!</h2>
                <p>Your responses have been successfully saved.</p>
                <button id="goToHomeBtn" 
                        style="padding: 10px 15px; background: #007BFF; color: white; border: none;
                            border-radius: 5px; cursor: pointer; font-size: 16px;">
                    Take me to my Homepage
                </button>
            </div>
        `;
        document.body.appendChild(popup);

        document.getElementById("goToHomeBtn").addEventListener("click", function () {
            window.location.href = "/";
        });

        nextVideoBtn.style.display = "none";
    }

    // ✅ Attach event listener
    nextVideoBtn.addEventListener("click", nextVideo);

    // ✅ Load the first video on page load
    loadVideo(currentVideoIndex);
});