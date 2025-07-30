# python-scripts/tts_pyttsx.py
import pyttsx3
import sys
import os

def text_to_speech(input_text_file, output_audio_file):
    engine = pyttsx3.init()
    
    # Set voice properties
    engine.setProperty('rate', 150)  # Adjust speed (default is around 200)
    engine.setProperty('volume', 0.9)  # Volume: 0.0 to 1.0
    
    # Read text from file and generate speech
    with open(input_text_file, "r", encoding="utf-8") as file:
        text = file.read()
    
    engine.save_to_file(text, output_audio_file)
    engine.runAndWait()

if __name__ == "__main__":
    input_text_file = sys.argv[1]
    output_audio_file = sys.argv[2]

    if not os.path.exists(input_text_file):
        print(f"Input text file {input_text_file} does not exist.")
        sys.exit(1)

    text_to_speech(input_text_file, output_audio_file)
    print(f"Audio file saved as {output_audio_file}")
