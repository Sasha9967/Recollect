document.addEventListener("DOMContentLoaded", function () {
    const startGameBtn = document.getElementById("startGameBtn");
    const statusMessage = document.getElementById("statusMessage");

    if (!startGameBtn) {
        console.error("Error: startGameBtn not found in gameHome.html!");
        return;
    }

    startGameBtn.addEventListener("click", function () {
        startGame();
    });

    function startGame() {
        statusMessage.textContent = "Loading... Please wait.";

        fetch("http://127.0.0.1:5000/start_game")
            .then(response => response.json())
            .then(data => {
                console.log("Received data from backend:", data); // ✅ Debugging

                if (data.error) {
                    statusMessage.textContent = "Error: " + data.error;
                    return;
                }

                const selectedDate = data.selected_date;
                const videoFiles = data.videos;
                const timeOptions = data.time_ranges;

                if (!videoFiles || videoFiles.length === 0) {
                    statusMessage.textContent = "No videos available for this date.";
                    return;
                }

                // Save to session storage (for use in playGame.html)
                sessionStorage.setItem("selectedDate", selectedDate);
                sessionStorage.setItem("videoFiles", JSON.stringify(videoFiles));
                sessionStorage.setItem("timeOptions", JSON.stringify(timeOptions));

                console.log("Stored in sessionStorage:", sessionStorage); // ✅ Debugging

                // Redirect to playGame.html
                window.location.href = "playGame.html";
            })
            .catch(error => {
                statusMessage.textContent = "Failed to start game. Try again.";
                console.error("Error fetching game data:", error);
            });
    }
});
