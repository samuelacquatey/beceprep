import google.generativeai as genai
import os

# Configure your API key
genai.configure(api_key="AIzaSyDBJeXCHRFHZQbYebq2yCs43kMnLIyb904")

# List available models
print("Available models:")
for model in genai.list_models():
    print(f"Name: {model.name}")
    print(f"Supported methods: {model.supported_generation_methods}\n")
