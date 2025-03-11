document.addEventListener("DOMContentLoaded", function () {
    const gridContainer = document.getElementById("datetime-grid");
    const selectedInfo = document.getElementById("selected-info");

    if (!gridContainer) {
        console.error("Error: #datetime-grid not found in DOM.");
        return;
    }

    const today = new Date();
    window.selectedDate = null;
    window.selectedTime = null;

    const timeSlots = Array.from({ length: 13 }, (_, i) => `${8 + i}:00`); // 8:00 AM - 8:00 PM

    function formatDate(date) {
        return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    }

    function getWeekDates(startDate) {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date;
        });
    }

    function renderDateTimeGrid() {
        gridContainer.innerHTML = ""; // Ensure it's empty before rendering

        const weekDates = getWeekDates(today);
        gridContainer.style.gridTemplateColumns = `repeat(8, 1fr)`;

        // **Header Row**
        gridContainer.appendChild(createHeaderCell("Time"));
        weekDates.forEach(date => {
            const headerCell = createHeaderCell(formatDate(date));
            gridContainer.appendChild(headerCell);
        });

        // **Time & Date Grid**
        timeSlots.forEach(time => {
            const timeCell = createTimeCell(time);
            gridContainer.appendChild(timeCell);

            weekDates.forEach(date => {
                const timeSlot = createTimeSlot(date, time);
                gridContainer.appendChild(timeSlot);
            });
        });
    }

    function createHeaderCell(text) {
        const cell = document.createElement("div");
        cell.classList.add("date-header");
        cell.textContent = text;
        return cell;
    }

    function createTimeCell(time) {
        const cell = document.createElement("div");
        cell.classList.add("time-label");
        cell.textContent = time;
        return cell;
    }

    function createTimeSlot(date, time) {
        const cell = document.createElement("div");
        cell.classList.add("time-slot");

        cell.addEventListener("click", () => {
            window.selectedDate = date;
            window.selectedTime = time;
            selectedInfo.textContent = `Selected: ${formatDate(window.selectedDate)} at ${window.selectedTime}`;
            highlightSelected(cell);
        });

        return cell;
    }

    function highlightSelected(selectedCell) {
        document.querySelectorAll(".time-slot").forEach(cell => {
            cell.classList.remove("selected");
        });
        selectedCell.classList.add("selected");
    }

    renderDateTimeGrid(); // ✅ Only runs if `gridContainer` exists
});
