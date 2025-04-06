// Add this to the start of your script.js file
document.addEventListener('DOMContentLoaded', () => {
    // First check client-side authentication
    if (!localStorage.getItem("authenticated")) {
        window.location.href = "index.html";
        return;
    }
    
    // Then verify with server (optional but more secure)
    fetch('https:///greenhouse-project.atwebpages.com/session_check.php')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                // Session expired or invalid
                localStorage.removeItem("authenticated");
                window.location.href = "index.html";
                return;
            }
            
            // User is authenticated, continue loading the dashboard
            // Display username if available
            if (document.getElementById('username-display')) {
                document.getElementById('username-display').textContent = 
                    `Welcome, ${localStorage.getItem("username") || "User"}`;
            }
            
            // Initialize the dashboard
            initializeDashboard();
        })
        .catch(error => {
            console.error("Session check error:", error);
            // Continue anyway if server check fails, relying on client-side auth
            initializeDashboard();
        });
    
    // Logout button event handler
    document.getElementById('logout').addEventListener('click', function() {
        localStorage.removeItem("authenticated");
        localStorage.removeItem("username");
        
        // Optionally clear the server-side session
        fetch('https://greenhouse-project.atwebpages.com/logout.php')
            .finally(() => {
                window.location.href = "index.html";
            });
    });
    
    // Function to initialize the dashboard after authentication
    function initializeDashboard() {
        // Initially hide both graphs
        document.getElementById('tempGraph').style.display = 'none';
        document.getElementById('humGraph').style.display = 'none';
        
        // Continue with the rest of your dashboard initialization code
        // (fetch data, create charts, etc.)
        
        // The rest of your existing script.js code goes here...
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Initially hide both graphs
    document.getElementById('tempGraph').style.display = 'none';
    document.getElementById('humGraph').style.display = 'none';
    // Fetch data and update charts
    fetch('https://greenhouse-project.atwebpages.com/get_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            // Reverse the data to show the newest data on the right
            let reversedData = data.reverse();
            let timestamps = reversedData.map(entry => entry.timestamp);
            let temperatures = reversedData.map(entry => entry.temperature);
            let humidities = reversedData.map(entry => entry.humidity);

            // Create the temperature chart
            const tempCtx = document.getElementById('temperatureChart').getContext('2d');
            const temperatureChart = new Chart(tempCtx, {
                type: 'bar',
                data: {
                    labels: timestamps.slice(-4), // Show only the last 4 timestamps
                    datasets: [{
                        label: 'Temperature (°C)',
                        data: temperatures.slice(-4), // Show only last 4 data points
                        backgroundColor: 'rgba(255, 99, 132, 0.7)', // Soft red bars
                        borderRadius: 8, // Rounded edges
                        barThickness: 25, // Adjust bar thickness
                    }]
                },
                options: {
                    indexAxis: 'y', // Make bars horizontal
                    responsive: true,
                    scales: {
                        x: { display: false }, // Hide X-axis
                        y: {
                            ticks: { color: 'black' }, // Show only time labels
                            grid: { display: false }
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart',
                    },
                    plugins: {
                        legend: { display: false }, // Hide legend
                        tooltip: { enabled: false }, // Disable default tooltips
                        datalabels: {
                            anchor: 'end',
                            align: 'right',
                            color: 'black',
                            backgroundColor: 'white',
                            borderRadius: 4,
                            padding: 6,
                            formatter: (value) => `${value} °C` // Display data inside a white box
                        }
                    }
                }
            });

            // Create the humidity chart
            const humCtx = document.getElementById('humidityChart').getContext('2d'); // Fixed ID
            const humidityChart = new Chart(humCtx, {
                type: 'bar',
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
                        y: {
                            beginAtZero: false,
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart',
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });

            // Ensure the charts are always visible
            document.getElementById('temperatureChart').style.display = 'block';
            document.getElementById('humidityChart').style.display = 'block';

            // Function to update the charts with the latest data
            function updateChartData() {
                fetch('https://greenhouse-project.atwebpages.com/get_data.php')
                    .then(response => response.json())
                    .then(newData => {
                        if (newData.error) {
                            console.error(newData.error);
                            return;
                        }

                        // Reverse the new data to maintain the newest data on the right
                        let latestEntry = newData.reverse()[0];
                        let newTimestamp = latestEntry.timestamp;
                        let newTemperature = latestEntry.temperature;
                        let newHumidity = latestEntry.humidity;

                        // Update temperature chart
                        temperatureChart.data.labels.shift();
                        temperatureChart.data.datasets[0].data.shift();
                        temperatureChart.data.labels.push(newTimestamp);
                        temperatureChart.data.datasets[0].data.push(newTemperature);
                        temperatureChart.update();

                        // Update humidity chart
                        humidityChart.data.labels.shift();
                        humidityChart.data.datasets[0].data.shift();
                        humidityChart.data.labels.push(newTimestamp);
                        humidityChart.data.datasets[0].data.push(newHumidity);
                        humidityChart.update();
                    })
                    .catch(error => console.error('Error updating chart data:', error));
            }

            // Set the interval to update data every 60 seconds (60000ms)
            setInterval(updateChartData, 60000);

            // Add event listeners for the icon buttons
            document.getElementById('showTemp').addEventListener('click', () => {
                document.getElementById('tempGraph').style.display = 'block';
                document.getElementById('humGraph').style.display = 'none';
            });

            document.getElementById('showHum').addEventListener('click', () => {
                document.getElementById('tempGraph').style.display = 'none';
                document.getElementById('humGraph').style.display = 'block';
            });

            document.getElementById('home-page').addEventListener('click', () => {
                document.getElementById('tempGraph').style.display = 'none';
                document.getElementById('humGraph').style.display = 'none';
            });
        })
        .catch(error => console.error('Error fetching initial data:', error));
});


        cancelAnimationFrame(request);
        request = requestAnimationFrame(update);
    });

    function update() {
        dx = mouse.x - cx;
        dy = mouse.y - cy;

        tiltx = -(dy / cy); // Invert the direction for correct following
        tilty = dx / cx;   // Invert the direction for correct following
        radius = Math.sqrt(Math.pow(tiltx, 2) + Math.pow(tilty, 2));
        degree = radius * 20;

        TweenLite.to("#design-container", 1, {
            transform: 'rotate3d(' + tiltx + ', ' + tilty + ', 0, ' + degree + 'deg)',
            ease: Power2.easeOut
        });
    }
