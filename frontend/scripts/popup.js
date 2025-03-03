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
