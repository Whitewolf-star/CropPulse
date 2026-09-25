import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in .env")

client = genai.Client(api_key=api_key)

MODEL = "gemma-4-26b-a4b-it"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}

    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # Weather information sent from CropPulse frontend
    weather = data.get("weather", {})

    weather_context = ""

    if weather:
        weather_context = f"""
Current weather information checked by the CropPulse user:

Location: {weather.get("location", "Unknown")}
Temperature: {weather.get("temperature", "Unknown")} °C
Humidity: {weather.get("humidity", "Unknown")} %
Rain: {weather.get("rain", "Unknown")} mm

Use this weather information when it is relevant to the farmer's question.
Do not invent weather values.
"""

    prompt = f"""
You are CropPulse, an AI-powered farming assistant.

Your job is to help farmers make practical decisions about crops.

You can help with:
- Crop selection
- Soil
- Irrigation
- Fertilizers
- Pests and diseases
- Weather-related farming decisions
- General crop care

IMPORTANT RULES:

1. Give simple, practical answers that a farmer can understand.
2. Do not invent weather information.
3. If current weather information is provided below, use it when relevant.
4. Clearly distinguish between general farming advice and information based
   on the user's current weather.
5. If important information is missing, ask a short follow-up question.
6. If the question requires very recent information that you do not have,
   clearly say that current information would need to be checked.
7. Do not pretend that you searched the internet if you did not.
8. For crop problems, try to provide:
   - Possible causes
   - Recommended actions
   - Prevention tips

{weather_context}

Farmer's question:
{user_message}
"""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )

        if not response.text:
            return jsonify({
                "error": "The AI returned an empty response. Please try again."
            }), 500

        return jsonify({
            "reply": response.text
        })

    except Exception as e:
        print("AI ERROR:", e)

        return jsonify({
            "error": "CropPulse AI could not answer right now. Please try again."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)