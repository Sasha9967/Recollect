document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const navPopup = document.querySelector(".nav-popup");
    const closeBtn = document.querySelector(".close-menu");

    if (menuToggle && navPopup && closeBtn) {
        menuToggle.addEventListener("click", function () {
            navPopup.classList.add("show"); 
        });

        closeBtn.addEventListener("click", function () {
            closePopupWithDelay();
        });

        // Close menu when clicking outside the popup content
        navPopup.addEventListener("click", function (event) {
            if (event.target === navPopup) {
                closePopupWithDelay();
            }
        });

        // Function to add a smooth delay before closing
        function closePopupWithDelay() {
            navPopup.style.opacity = "0";
            navPopup.style.transform = "translateY(-20px)"; // Moves back up slightly

            setTimeout(() => {
                navPopup.classList.remove("show");
            }, 700); // Waits 600ms before hiding
        }
    }
});

// Function to navigate to a new page
function navigateTo(page) {
    window.location.href = page;
}


// Function to stop recording
function stopRecording() {
    alert("Loading... Please wait.");

    fetch("http://127.0.0.1:5000/stop_recording", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())  // Convert response to JSON
    .then(data => {
        if (data.success) {
            alert("✅ Recording stopped successfully!");
        } else {
            alert("❌ Failed to stop recording. Server response: " + (data.message || "Unknown error."));
        }
    })
    .catch(error => {
        alert(`⚠️ Error: ${error.message}\nPlease check the server connection.`);
    });
}
