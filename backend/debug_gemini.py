import os
from dotenv import load_dotenv
from google import genai

# Force load .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("AI_MODEL")

with open("debug_result.txt", "w") as f:
    f.write("--- DEBUG INFO ---\n")
    f.write(f"API Key present: {'Yes' if api_key else 'No'}\n")
    if api_key:
        f.write(f"Key preview: {api_key[:5]}...{api_key[-5:]}\n")
    f.write(f"Model: {model}\n")
    f.write("\nAttempting to connect to Gemini...\n")

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents="Just say 'Connection Successful'"
        )
        f.write("\n✅ SUCCESS!\n")
        f.write(f"Response: {response.text}\n")
    except Exception as e:
        f.write("\n❌ ERROR DETAILS:\n")
        f.write(str(e) + "\n")

print("Done. Check debug_result.txt")
