document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("startSessionBtn").addEventListener("click", startRecording);
    document.getElementById("stopSessionBtn").addEventListener("click", stopRecording);
});

async function startRecording() {
    try {
        document.getElementById("startSessionBtn").disabled = true;
        const response = await fetch('http://192.168.188.199:5000/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        alert(data.message || data.error);
    } catch (error) {
        console.error("Error starting recording:", error);
        alert("Failed to start recording.");
    } finally {
        document.getElementById("startSessionBtn").disabled = false;
    }
}

async function stopRecording() {
    try {
        const response = await fetch('http://192.168.188.199:5000/stop_recording', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        alert(data.message || data.error);
    } catch (error) {
        console.error("Error stopping recording:", error);
        alert("Failed to stop recording.");
    }
}
