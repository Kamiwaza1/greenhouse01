document.addEventListener('DOMContentLoaded', () => {
    // Initialize the dashboard
    function initializeDashboard() {
        document.getElementById('tempGraph').style.display = 'none';
        document.getElementById('humGraph').style.display = 'none';
    }

    initializeDashboard();

    // Variables to store chart instances and ESP32 status
    let temperatureChart = null;
    let humidityChart = null;
    let lastDataTimestamp = null; // Track the timestamp of the latest data
    const offlineThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Fetch data and update charts
    function fetchAndUpdateCharts() {
        fetch('http://greenhouse-project.atwebpages.com/get_data.php')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                // Extract the latest 30 data points
                const latestGraphData = {
                    timestamps: data.slice(-30).map(entry => entry.timestamp),
                    temperatures: data.slice(-30).map(entry => entry.temperature),
                    humidities: data.slice(-30).map(entry => entry.humidity)
                };

                // Update the graphs with the latest data
                updateGraphs(latestGraphData);

                // Update ESP32 status
                const latestTimestamp = new Date(data[data.length - 1].timestamp).getTime();
                updateESP32Status(latestTimestamp);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                updateESP32Status(null); // Mark as offline if fetch fails
            });
    }

    // Update the graphs
    function updateGraphs(latestGraphData) {
        const { timestamps, temperatures, humidities } = latestGraphData;

        
        // Update temperature chart
        const tempCtx = document.getElementById('temperatureChart').getContext('2d');
        temperatureChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatures,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: false,
                    borderWidth: 3,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Time' }, reverse: true },
                    y: { beginAtZero: false }

                },
                plugins: {
                    legend: { display: true, position: 'top' }
                }
            }
        });

        // Update humidity chart
        const humCtx = document.getElementById('humidityChart').getContext('2d');
        humidityChart = new Chart(humCtx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Humidity (%)',
                    data: humidities,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    fill: false,
                    borderWidth: 3,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Time'  }, reverse: true },
                    y: { beginAtZero: false }
                },
                plugins: {
                    legend: { display: true, position: 'top' }
                }
            }
        });
    }

    // Update ESP32 status
    function updateESP32Status(latestTimestamp) {
        const statusBar = document.getElementById('sensorStatusBar');
        const statusText = document.getElementById('sensorStatus');

        if (latestTimestamp) {
            const currentTime = new Date().getTime();
            const timeDifference = currentTime - latestTimestamp;

            if (timeDifference <= offlineThreshold) {
                statusBar.style.backgroundColor = '#28a745'; // Green
                statusText.textContent = 'Online';
                lastDataTimestamp = latestTimestamp; // Update the last known timestamp
            } else {
                statusBar.style.backgroundColor = '#dc3545'; // Red
                statusText.textContent = 'Offline';
            }
        } else {
            statusBar.style.backgroundColor = '#dc3545'; // Red
            statusText.textContent = 'Offline';
        }
    }

    // Fetch and update charts every 30 minutes
    fetchAndUpdateCharts();
    setInterval(fetchAndUpdateCharts, 1800000); // 30 minutes


    // Dark mode toggle
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
        });
    }
});

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

