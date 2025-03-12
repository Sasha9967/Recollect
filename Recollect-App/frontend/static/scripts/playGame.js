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

    if (videoFiles.length === 0) {
        console.error("No videos found in sessionStorage.");
        nextVideoBtn.textContent = "No videos available";
        nextVideoBtn.disabled = true;
        return;
    }

    function loadVideo(index) {
        if (index < videoFiles.length) {
            let videoURL = `http://192.168.188.199:5000/play/${videoFiles[index]}`;

            videoSource.src = videoURL;
            videoPlayer.load();

            if (index === videoFiles.length - 1) {
                nextVideoBtn.textContent = "Finish";
            }
        }
    }

    function saveCurrentSelection() {
        if (!window.selectedDate || !window.selectedTime) {
            alert("Please select a date and time before proceeding.");
            return false;
        }

        let selectedVideo = videoFiles[currentVideoIndex].split(".")[0];
        let selectedVideo_day = selectedVideo.split("-").slice(0, 3).join("-");
        let selectedVideo_time = selectedVideo.split("-").slice(3,5).join(":"); // Convert to HH:MM:SS format

        let response = {
            selected_date: window.selectedDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
            selected_time: window.selectedTime,  // User-selected time
            selected_video_day: selectedVideo_day, // Actual video date
            selected_video_time: selectedVideo_time, // Actual video time
        };

        // Convert selected and actual times to Date objects for comparison
        let actualDateTime = new Date(`${selectedVideo_day}T${selectedVideo_time}`);
        let selectedDateTime = new Date(`${response.selected_date}T${response.selected_time}`);

        // Extract hour component from selected and actual times
        let selectedHour = selectedDateTime.getHours();
        let actualHour = actualDateTime.getHours();

        // Allow selection if it falls within the correct hour range
        response.correct = selectedHour === actualHour;

        responses.push(response);

        showTimeDifferencePopup(response, selectedHour, actualHour, currentVideoIndex === videoFiles.length - 1);

        return true;
    }

    function showTimeDifferencePopup(response, selectedHour, actualHour, isLast) {
        let popup = document.createElement("div");
        popup.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: white; padding: 20px; border-radius: 10px; 
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2); text-align: center;">

                <h3 style="color: ${response.correct ? 'green' : 'red'};">
                    ${response.correct ? "Your selection was correct!" : "Your selection was incorrect!"}
                </h3>
                <p><strong>Time of Video:</strong> ${response.selected_video_day} ${response.selected_video_time}</p>
                <p><strong>Selected Time:</strong> ${response.selected_date} ${response.selected_time}</p>

                <button id="closePopupBtn" 
                        style="padding: 10px 15px; background: #007BFF; color: white; border: none;
                            border-radius: 5px; cursor: pointer; font-size: 16px;">
                    ${isLast ? "Submit" : "Continue"}
                </button>
            </div>
        `;
        document.body.appendChild(popup);
    
        document.getElementById("closePopupBtn").addEventListener("click", function() {
            if (isLast) {
                submit();
                document.body.removeChild(popup); // Close the popup
            } else {
                document.body.removeChild(popup); // Close the popup
                nextVideo();
            }
        });

        return true;
    }

    // Clears the blue highlight from previously selected time slots
    function clearScheduleSelection() {
        document.querySelectorAll(".time-slot.selected").forEach(cell => {
            cell.classList.remove("selected");
        });
    }

    async function nextVideo() {
        clearScheduleSelection();
        currentVideoIndex++;
    
        if (currentVideoIndex < videoFiles.length) {
            loadVideo(currentVideoIndex);
        }
    }
    
    function submit() {
        // Now submit all responses
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
            setTimeout(showSuccessPopup, 500); //Buffer
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
    }

    // Attach event listener
    nextVideoBtn.addEventListener("click", saveCurrentSelection);

    // Load the first video on page load
    loadVideo(currentVideoIndex);

});