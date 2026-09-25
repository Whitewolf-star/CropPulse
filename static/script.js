// ============================================================
// CropPulse - Main JavaScript
// ============================================================


// ============================================================
// PAGE NAVIGATION
// ============================================================

function switchPage(page) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(section => {
        section.classList.remove("active-page");
    });

    const selectedPage =
        document.getElementById(page + "Page");

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    const navButtons =
        document.querySelectorAll(".nav-btn");

    navButtons.forEach(button => {
        button.classList.remove("active");
    });

    navButtons.forEach(button => {

        if (
            button.getAttribute("onclick") ===
            `switchPage('${page}')`
        ) {
            button.classList.add("active");
        }

    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// HOME → CROP CHECK
// ============================================================

function showForm() {
    switchPage("crop");
}


// ============================================================
// CROP PAGE - GET WEATHER
// ============================================================

async function getWeather() {

    const locationInput =
        document.getElementById("location");

    const weatherResult =
        document.getElementById("weatherResult");

    const temperatureInput =
        document.getElementById("temperature");

    const humidityInput =
        document.getElementById("humidity");

    const rainfallInput =
        document.getElementById("rainfall");

    if (!locationInput || !weatherResult) {
        return;
    }

    const location =
        locationInput.value.trim();

    if (!location) {

        weatherResult.style.display = "block";

        weatherResult.innerHTML = `
            <div class="weather-card">
                📍 Please enter your location first.
            </div>
        `;

        return;
    }

    weatherResult.style.display = "block";

    weatherResult.innerHTML = `
        <div class="weather-card">
            🌦️ Getting live weather...
        </div>
    `;

    try {

        // ----------------------------------------------------
        // Find location coordinates
        // ----------------------------------------------------

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        );

        if (!geoResponse.ok) {
            throw new Error("Location service failed");
        }

        const geoData =
            await geoResponse.json();

        if (
            !geoData.results ||
            geoData.results.length === 0
        ) {

            weatherResult.innerHTML = `
                <div class="weather-card">
                    ❌ Location not found.
                    Please try another city or village.
                </div>
            `;

            return;
        }

        const place =
            geoData.results[0];


        // ----------------------------------------------------
        // Get current weather
        // ----------------------------------------------------

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain`
        );

        if (!weatherResponse.ok) {
            throw new Error("Weather service failed");
        }

        const weatherData =
            await weatherResponse.json();

        const current =
            weatherData.current;


        const temperature =
            current.temperature_2m;

        const humidity =
            current.relative_humidity_2m;

        const rain =
            current.rain;


        // ----------------------------------------------------
        // Save weather in hidden inputs
        // ----------------------------------------------------

        if (temperatureInput) {
            temperatureInput.value =
                temperature;
        }

        if (humidityInput) {
            humidityInput.value =
                humidity;
        }

        if (rainfallInput) {
            rainfallInput.value =
                rain;
        }


        // ----------------------------------------------------
        // Display weather
        // ----------------------------------------------------

        weatherResult.innerHTML = `
            <div class="weather-card">

                <h3>
                    🌦️ ${escapeHTML(place.name)}
                </h3>

                <div class="weather-details">

                    <p>
                        🌡️ Temperature:
                        <strong>
                            ${temperature}°C
                        </strong>
                    </p>

                    <p>
                        💧 Humidity:
                        <strong>
                            ${humidity}%
                        </strong>
                    </p>

                    <p>
                        🌧️ Rain:
                        <strong>
                            ${rain} mm
                        </strong>
                    </p>

                </div>

                <p class="weather-success">
                    ✅ Live weather retrieved successfully.
                </p>

            </div>
        `;


        // Store weather globally so AI can use it
        window.cropPulseWeather = {
            location: place.name,
            temperature: temperature,
            humidity: humidity,
            rain: rain
        };


    } catch (error) {

        console.error(
            "Weather error:",
            error
        );

        weatherResult.innerHTML = `
            <div class="weather-card">

                ❌ Unable to retrieve weather.

                <br><br>

                Please check your internet connection
                and try again.

            </div>
        `;
    }
}


// ============================================================
// CROP ANALYSIS
// ============================================================

async function analyzeCrop(event) {

    event.preventDefault();


    // --------------------------------------------------------
    // Get form values
    // --------------------------------------------------------

    const crop =
        document.getElementById("crop").value;

    const soil =
        document.getElementById("soil").value;

    const location =
        document.getElementById("location").value.trim();

    const stage =
        document.getElementById("stage").value;


    const result =
        document.getElementById("result");


    // --------------------------------------------------------
    // Validate form
    // --------------------------------------------------------

    if (
        !crop ||
        !soil ||
        !location ||
        !stage
    ) {

        result.style.display = "block";

        result.innerHTML = `
            <div class="result-card">

                ❌ Please fill in all the
                crop details first.

            </div>
        `;

        return;
    }


    // --------------------------------------------------------
    // Show loading
    // --------------------------------------------------------

    result.style.display = "block";

    result.innerHTML = `
        <div class="result-card">

            <h2>🌱 Analyzing your crop...</h2>

            <p>
                Getting current weather conditions
                and preparing your analysis.
            </p>

        </div>
    `;


    try {

        // ----------------------------------------------------
        // Get location
        // ----------------------------------------------------

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        );

        if (!geoResponse.ok) {
            throw new Error("Location search failed");
        }

        const geoData =
            await geoResponse.json();


        if (
            !geoData.results ||
            geoData.results.length === 0
        ) {

            result.innerHTML = `
                <div class="result-card">

                    ❌ We couldn't find
                    "${escapeHTML(location)}".

                    <br><br>

                    Please enter a valid city
                    or village.

                </div>
            `;

            return;
        }


        const place =
            geoData.results[0];


        // ----------------------------------------------------
        // Get current weather
        // ----------------------------------------------------

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain`
        );

        if (!weatherResponse.ok) {
            throw new Error("Weather request failed");
        }

        const weatherData =
            await weatherResponse.json();

        const current =
            weatherData.current;


        const temperature =
            current.temperature_2m;

        const humidity =
            current.relative_humidity_2m;

        const rain =
            current.rain;


        // ----------------------------------------------------
        // Risk calculation
        // ----------------------------------------------------

        let risk = "Low";
        let riskClass = "low-risk";


        if (
            humidity >= 85 ||
            temperature >= 38 ||
            rain >= 20
        ) {

            risk = "High";
            riskClass = "high-risk";

        } else if (
            humidity >= 70 ||
            temperature >= 32 ||
            rain >= 5
        ) {

            risk = "Moderate";
            riskClass = "medium-risk";
        }


        // ----------------------------------------------------
        // Save weather globally
        // ----------------------------------------------------

        window.cropPulseWeather = {

            location: place.name,

            temperature: temperature,

            humidity: humidity,

            rain: rain
        };


        // ----------------------------------------------------
        // Update dashboard
        // ----------------------------------------------------

        const dashboardCrop =
            document.getElementById("dashboardCrop");

        const dashboardTemp =
            document.getElementById("dashboardTemp");

        const dashboardRisk =
            document.getElementById("dashboardRisk");

        const dashboardLocation =
            document.getElementById("dashboardLocation");


        if (dashboardCrop) {
            dashboardCrop.textContent =
                crop;
        }

        if (dashboardTemp) {
            dashboardTemp.textContent =
                `${temperature}°C`;
        }

        if (dashboardRisk) {
            dashboardRisk.textContent =
                risk;
        }

        if (dashboardLocation) {
            dashboardLocation.textContent =
                place.name;
        }


        // ----------------------------------------------------
        // Display initial analysis
        // ----------------------------------------------------

        result.innerHTML = `

            <div class="result-card">

                <h2>
                    🌱 Crop Analysis
                </h2>


                <div class="analysis-grid">

                    <div>
                        <strong>🌾 Crop</strong>
                        <span>
                            ${escapeHTML(crop)}
                        </span>
                    </div>


                    <div>
                        <strong>🪨 Soil</strong>
                        <span>
                            ${escapeHTML(soil)}
                        </span>
                    </div>


                    <div>
                        <strong>🌱 Growth Stage</strong>
                        <span>
                            ${escapeHTML(stage)}
                        </span>
                    </div>


                    <div>
                        <strong>📍 Location</strong>
                        <span>
                            ${escapeHTML(place.name)}
                        </span>
                    </div>


                    <div>
                        <strong>🌡️ Temperature</strong>
                        <span>
                            ${temperature}°C
                        </span>
                    </div>


                    <div>
                        <strong>💧 Humidity</strong>
                        <span>
                            ${humidity}%
                        </span>
                    </div>


                    <div>
                        <strong>🌧️ Rain</strong>
                        <span>
                            ${rain} mm
                        </span>
                    </div>


                    <div class="${riskClass}">
                        <strong>🛡️ Risk Level</strong>
                        <span>
                            ${risk}
                        </span>
                    </div>

                </div>


                <div class="ai-analysis">

                    <h3>
                        🤖 AI Farming Advice
                    </h3>

                    <p>
                        🌱 CropPulse AI is analyzing
                        your crop conditions...
                    </p>

                </div>

            </div>
        `;


        // ----------------------------------------------------
        // Ask CropPulse AI
        // ----------------------------------------------------

        const aiQuestion = `

You are analyzing a farmer's crop.

Crop: ${crop}

Soil type: ${soil}

Location: ${place.name}

Growth stage: ${stage}

Current weather:

Temperature: ${temperature}°C

Humidity: ${humidity}%

Rainfall: ${rain} mm


Please provide practical farming advice.

Include:

1. Possible risks
2. Irrigation advice
3. Crop-care recommendations
4. Pest and disease precautions
5. Recommended next steps

Keep the explanation simple and practical.

Do not invent weather information.
Use the weather values provided above.

`;


        const aiResponse =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message:
                            aiQuestion,

                        weather: {

                            location:
                                place.name,

                            temperature:
                                temperature,

                            humidity:
                                humidity,

                            rain:
                                rain
                        }
                    })
                }
            );


        const aiData =
            await aiResponse.json();


        // ----------------------------------------------------
        // Display AI answer
        // ----------------------------------------------------

        const aiBox =
            result.querySelector(
                ".ai-analysis"
            );


        if (aiBox) {

            if (aiData.reply) {

                aiBox.innerHTML = `

                    <h3>
                        🤖 AI Farming Advice
                    </h3>

                    <div class="ai-response">

                        ${formatAIResponse(
                    aiData.reply
                )}

                    </div>

                `;

            } else {

                aiBox.innerHTML = `

                    <h3>
                        🤖 AI Farming Advice
                    </h3>

                    <p>

                        ❌ ${escapeHTML(
                    aiData.error ||
                    "AI could not provide an answer."
                )
                    }

                    </p>

                `;
            }
        }


    } catch (error) {

        console.error(
            "Crop analysis error:",
            error
        );


        result.style.display = "block";

        result.innerHTML = `

            <div class="result-card">

                <h2>
                    ❌ Analysis failed
                </h2>

                <p>
                    We couldn't complete the crop
                    analysis right now.
                </p>

                <p>
                    Please check your internet
                    connection and try again.
                </p>

            </div>

        `;
    }
}


// ============================================================
// WEATHER CENTER PAGE
// ============================================================

async function getWeatherFromPage() {

    const locationInput =
        document.getElementById(
            "weatherLocation"
        );

    const result =
        document.getElementById(
            "pageWeatherResult"
        );


    if (!locationInput || !result) {
        return;
    }


    const location =
        locationInput.value.trim();


    if (!location) {

        result.innerHTML = `

            <div class="weather-card">

                📍 Please enter a location first.

            </div>

        `;

        return;
    }


    result.innerHTML = `

        <div class="weather-card">

            🌦️ Getting live weather...

        </div>

    `;


    try {

        // ----------------------------------------------------
        // Find location
        // ----------------------------------------------------

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        );


        if (!geoResponse.ok) {
            throw new Error("Geocoding failed");
        }


        const geoData =
            await geoResponse.json();


        if (
            !geoData.results ||
            geoData.results.length === 0
        ) {

            result.innerHTML = `

                <div class="weather-card">

                    ❌ Location not found.

                </div>

            `;

            return;
        }


        const place =
            geoData.results[0];


        // ----------------------------------------------------
        // Get weather
        // ----------------------------------------------------

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain`
        );


        if (!weatherResponse.ok) {
            throw new Error("Weather failed");
        }


        const weatherData =
            await weatherResponse.json();


        const current =
            weatherData.current;


        const temperature =
            current.temperature_2m;

        const humidity =
            current.relative_humidity_2m;

        const rain =
            current.rain;


        // ----------------------------------------------------
        // Save weather globally for AI
        // ----------------------------------------------------

        window.cropPulseWeather = {

            location: place.name,

            temperature: temperature,

            humidity: humidity,

            rain: rain
        };


        // ----------------------------------------------------
        // Display weather
        // ----------------------------------------------------

        result.innerHTML = `

            <div class="weather-card">

                <h3>
                    🌦️ ${escapeHTML(place.name)}
                </h3>


                <div class="weather-details">

                    <p>
                        🌡️ Temperature:
                        <strong>
                            ${temperature}°C
                        </strong>
                    </p>


                    <p>
                        💧 Humidity:
                        <strong>
                            ${humidity}%
                        </strong>
                    </p>


                    <p>
                        🌧️ Rain:
                        <strong>
                            ${rain} mm
                        </strong>
                    </p>

                </div>


                <p class="weather-success">

                    ✅ Live weather retrieved successfully.

                </p>

            </div>

        `;


    } catch (error) {

        console.error(
            "Weather page error:",
            error
        );


        result.innerHTML = `

            <div class="weather-card">

                ❌ Unable to retrieve weather.

                <br><br>

                Please check your internet
                connection and try again.

            </div>

        `;
    }
}


// ============================================================
// AI CHAT
// ============================================================

async function sendChatMessage(event) {

    event.preventDefault();


    const input =
        document.getElementById(
            "chatInput"
        );

    const chatMessages =
        document.getElementById(
            "chatMessages"
        );


    if (!input || !chatMessages) {
        return;
    }


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    // --------------------------------------------------------
    // Display user's message
    // --------------------------------------------------------

    chatMessages.innerHTML += `

        <div class="chat-message user-message">

            <strong>You:</strong>

            ${escapeHTML(message)}

        </div>

    `;


    input.value = "";


    // --------------------------------------------------------
    // Thinking message
    // --------------------------------------------------------

    chatMessages.innerHTML += `

        <div
            class="chat-message ai-message"
            id="thinkingMessage"
        >

            <strong>
                CropPulse:
            </strong>

            🌱 Thinking...

        </div>

    `;


    chatMessages.scrollTop =
        chatMessages.scrollHeight;


    // --------------------------------------------------------
    // Use the latest weather
    // --------------------------------------------------------

    let weather = {};


    if (window.cropPulseWeather) {

        weather =
            window.cropPulseWeather;

    }


    // --------------------------------------------------------
    // Send to Flask
    // --------------------------------------------------------

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: message,

                        weather: weather

                    })
                }
            );


        const data =
            await response.json();


        // Remove thinking
        const thinkingMessage =
            document.getElementById(
                "thinkingMessage"
            );


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        // ----------------------------------------------------
        // AI response
        // ----------------------------------------------------

        if (data.reply) {

            chatMessages.innerHTML += `

                <div class="chat-message ai-message">

                    <strong>
                        CropPulse:
                    </strong>

                    <div class="ai-response">

                        ${formatAIResponse(
                data.reply
            )}

                    </div>

                </div>

            `;

        } else {

            chatMessages.innerHTML += `

                <div class="chat-message ai-message">

                    <strong>
                        CropPulse:
                    </strong>

                    ❌ ${escapeHTML(
                data.error ||
                "Something went wrong."
            )
                }

                </div>

            `;
        }


        chatMessages.scrollTop =
            chatMessages.scrollHeight;


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        const thinkingMessage =
            document.getElementById(
                "thinkingMessage"
            );


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        chatMessages.innerHTML += `

            <div class="chat-message ai-message">

                <strong>
                    CropPulse:
                </strong>

                ❌ Unable to connect to
                the AI server.

                Please make sure Flask
                is running.

            </div>

        `;


        chatMessages.scrollTop =
            chatMessages.scrollHeight;
    }
}


// ============================================================
// AI SUGGESTIONS
// ============================================================

function askSuggestion(question) {

    switchPage("ai");


    const input =
        document.getElementById(
            "chatInput"
        );


    if (!input) {
        return;
    }


    input.value = question;

    input.focus();
}


// ============================================================
// FORMAT AI RESPONSE
// ============================================================

function formatAIResponse(text) {

    if (!text) {
        return "";
    }


    let formatted =
        escapeHTML(text);


    // Bold
    formatted =
        formatted.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // Headings
    formatted =
        formatted.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    // Numbered list
    formatted =
        formatted.replace(
            /^\d+\.\s+(.*)$/gm,
            "<li>$1</li>"
        );


    // Bullet list
    formatted =
        formatted.replace(
            /^[-•]\s+(.*)$/gm,
            "<li>$1</li>"
        );


    // Line breaks
    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );


    return formatted;
}


// ============================================================
// SECURITY
// ============================================================

function escapeHTML(text) {

    if (
        text === undefined ||
        text === null
    ) {
        return "";
    }


    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}