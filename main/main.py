"""
Main application file for AI Video Transcriber
This is the entry point that starts the Django web server
"""

# Import Django requirements
import os
import sys
import django  # type: ignore
from pathlib import Path
from dotenv import load_dotenv  # type: ignore
import re
from collections import Counter

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

# Import our custom modules
from app.transcriber import VideoTranscriber  # Handles video transcription with Whisper
from app.gemini import GeminiProcessor  # Handles AI processing with Gemini
from app.text_analyzer import TextAnalyzer  # Handles advanced NLP with Transformers

# Function to detect repeated words in transcript
def detect_repeated_words(transcript, min_length=4, min_occurrences=3, max_results=10):
    """Detect words that are frequently repeated in the transcript"""
    # Convert to lowercase and remove punctuation
    text = re.sub(r'[^\w\s]', '', transcript.lower())
    
    # Split into words
    words = [word for word in text.split() if len(word) >= min_length]
    
    # Count occurrences
    word_counts = Counter(words)
    
    # Expanded list of common words to filter out
    common_words = [
        'this', 'that', 'with', 'have', 'from', 'they', 'will', 'would', 
        'there', 'their', 'what', 'when', 'were', 'your', 'which', 'about', 
        'then', 'some', 'these', 'those', 'been', 'being', 'very', 'just',
        'because', 'where', 'through', 'should', 'could', 'other', 'after',
        'before', 'while', 'than', 'them', 'into', 'over', 'under', 'here'
    ]
    
    # Filter out common words and keep only those that appear frequently
    repeated = [
        {'word': word, 'count': count} 
        for word, count in word_counts.most_common(30) 
        if count >= min_occurrences and word not in common_words
    ]
    
    # Sort by frequency (highest to lowest)
    repeated.sort(key=lambda x: x['count'], reverse=True)
    
    return repeated[:max_results]  # Return limited number of results

# Function to detect filler words in transcript
def detect_filler_words(transcript, max_results=10):
    """Detect filler words in the transcript"""
    # Comprehensive list of common filler words and phrases
    filler_words = [
        # Basic fillers
        'um', 'uh', 'ah', 'er', 'eh', 'hmm', 'mmm', 'huh', 
        'uhh', 'umm', 'mm', 'mhm', 'erm',
        
        # Phrase fillers
        'you know', 'i mean', 'like', 'sort of', 'kind of', 
        'basically', 'literally', 'actually', 'obviously',
        
        # Conversational fillers
        'right', 'okay', 'so', 'well', 'just', 'stuff', 'things',
        'yeah', 'you see', 'see what i mean', 'if you will',
        
        # Hesitation indicators
        'anyway', 'anyhow', 'whatever', 'and stuff', 'and things'
    ]
    
    # Convert to lowercase and ensure proper word boundaries
    text = transcript.lower()
    
    # Count filler words with proper word boundary detection
    filler_counts = []
    for filler in filler_words:
        # Create regex pattern with word boundaries
        pattern = r'\b' + re.escape(filler) + r'\b'
        
        # Find all occurrences
        matches = re.findall(pattern, text)
        count = len(matches)
        
        # Only include if found in transcript
        if count > 0:
            filler_counts.append({
                'word': filler, 
                'count': count,
                # Calculate percentage of total words for context
                'percentage': round((count / len(text.split())) * 100, 1)
            })
    
    # Sort by frequency (most frequent first)
    filler_counts.sort(key=lambda x: x['count'], reverse=True)
    
    return filler_counts[:max_results]  # Return limited number of results

# Load API key from .env file
load_dotenv()

# Create necessary directories and check permissions
uploads_dir = Path("uploads").absolute()
outputs_dir = Path("outputs").absolute()

# Create directories with proper permissions
os.makedirs(uploads_dir, exist_ok=True)  # For uploaded files
os.makedirs(outputs_dir, exist_ok=True)  # For output files

# Verify the directories are writable
if not os.access(uploads_dir, os.W_OK):
    print(f"WARNING: Upload directory {uploads_dir} is not writable!")
if not os.access(outputs_dir, os.W_OK):
    print(f"WARNING: Outputs directory {outputs_dir} is not writable!")

def initialize_components():
    """Initialize the AI components for the application"""
    # STEP 0: Check for ffmpeg availability
    print("Starting AI Video Transcriber...")
    print("Step 0/3: Checking ffmpeg availability...")
    from app.transcriber import ensure_ffmpeg_available, ffmpeg_available
    if ensure_ffmpeg_available():
        print("ffmpeg found and available!")
    else:
        print("WARNING: ffmpeg not found! Video transcription may fail.")
        print("Please install ffmpeg: https://ffmpeg.org/download.html")
        
    # STEP 1: Initialize the Whisper transcriber
    # This loads the Whisper model which may take some time
    print("Step 1/3: Loading Whisper model...")
    from app.transcriber import VideoTranscriber
    transcriber = VideoTranscriber()

    # STEP 2: Set up the Gemini processor
    # First check if we have an API key in the .env file
    print("Step 2/3: Setting up Gemini AI...")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY not found in .env file!")
        print("Please add your API key to the .env file.")
        gemini_processor = None
    else:
        print("Gemini API key found, initializing processor...")
        from app.gemini import GeminiProcessor
        gemini_processor = GeminiProcessor(GEMINI_API_KEY)
        print("Gemini processor initialized successfully!")

    # STEP 3: Initialize the TextAnalyzer
    print("Step 3/3: Loading HuggingFace Transformers models...")
    from app.text_analyzer import TextAnalyzer
    text_analyzer = TextAnalyzer()
    print("Text analyzer initialized successfully!")
    
    return transcriber, gemini_processor, text_analyzer

# Function to detect repeated words and filler words was kept from above

def create_django_template():
    """Create Django template from the HTML file"""
    # Create a basic HTML template since frontend/index.html doesn't exist
    content = """{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>U-Speak Video Analysis</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .upload-form {
            text-align: center;
            margin: 20px 0;
        }
        input[type="file"] {
            margin: 10px 0;
            padding: 10px;
            border: 2px dashed #ccc;
            border-radius: 5px;
            width: 100%;
            max-width: 400px;
        }
        button {
            background: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        button:hover {
            background: #0056b3;
        }
        #results {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            display: none;
        }
        .loading {
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>U-Speak Video Analysis System</h1>
        
        <form id="uploadForm" enctype="multipart/form-data">
            {% csrf_token %}
            <div class="upload-form">
                <input type="file" id="videoFile" name="video" accept="video/*" required>
                <br><br>
                <button type="submit">Analyze Video</button>
            </div>
        </form>
        
        <div id="results">
            <h2>Analysis Results</h2>
            <div id="analysisContent"></div>
        </div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            const fileInput = document.getElementById('videoFile');
            const resultsDiv = document.getElementById('results');
            const analysisContent = document.getElementById('analysisContent');
            
            if (!fileInput.files[0]) {
                alert('Please select a video file first.');
                return;
            }
            
            formData.append('video', fileInput.files[0]);
            
            // Show loading state
            resultsDiv.style.display = 'block';
            analysisContent.innerHTML = '<div class="loading">Analyzing video... This may take a few minutes.</div>';
            
            try {
                const response = await fetch('/api/analyze-video/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    analysisContent.innerHTML = `
                        <h3>✅ Analysis Complete!</h3>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    analysisContent.innerHTML = `
                        <h3>❌ Analysis Failed</h3>
                        <p>Error: ${data.error || 'Unknown error occurred'}</p>
                    `;
                }
            } catch (error) {
                analysisContent.innerHTML = `
                    <h3>❌ Network Error</h3>
                    <p>Error: ${error.message}</p>
                `;
            }
        });
    </script>
</body>
</html>"""
    
    # Save to Django templates directory
    os.makedirs('templates', exist_ok=True)
    with open("templates/index.html", "w") as f:
        f.write(content)
    
    print("Django template created successfully!")

def run_django():
    """Run the Django application"""
    from django.core.management import execute_from_command_line  # type: ignore
    
    # Initialize AI components
    transcriber, gemini_processor, text_analyzer = initialize_components()
    
    # Create template from existing HTML
    create_django_template()
    
    # Run the Django server
    execute_from_command_line(["manage.py", "runserver", "127.0.0.1:8000"])

if __name__ == "__main__":
    import tempfile
    import shutil
    try:
        run_django()
    except ImportError:
        print("Django is not installed. Please install it with:")
        print("pip install django djangorestframework")
        sys.exit(1)