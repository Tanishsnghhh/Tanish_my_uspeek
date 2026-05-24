#!/usr/bin/env python3
"""
Django server startup script for video analysis backend
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Run Django development server"""
    
    # Set the Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
    
    # Get the directory of this script
    BASE_DIR = Path(__file__).parent
    
    print("🚀 Starting Django Video Analysis Backend...")
    print(f"📁 Working directory: {BASE_DIR}")
    
    # Check if virtual environment exists
    venv_path = BASE_DIR / 'venv'
    if venv_path.exists():
        print("✅ Virtual environment found")
        python_executable = venv_path / 'bin' / 'python'
        if not python_executable.exists():
            python_executable = venv_path / 'Scripts' / 'python.exe'  # Windows
    else:
        print("⚠️  No virtual environment found, using system Python")
        python_executable = sys.executable
    
    try:
        # Change to the Django project directory
        os.chdir(BASE_DIR)
        
        # Run migrations first
        print("📦 Running Django migrations...")
        subprocess.run([
            str(python_executable), 'manage.py', 'migrate'
        ], check=True)
        
        # Start Django development server
        print("🌐 Starting Django server on http://localhost:8000")
        print("📹 Video Analysis API available at:")
        print("   - Upload: http://localhost:8000/app/upload-video/")
        print("   - Pose Analysis: http://localhost:8000/app/pose-voice-analysis/")
        print("   - Feedback: http://localhost:8000/app/generate-coach-feedback/")
        print("   - Health Check: http://localhost:8000/app/health/")
        print("\n🛑 Press Ctrl+C to stop the server\n")
        
        subprocess.run([
            str(python_executable), 'manage.py', 'runserver', '8000'
        ])
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running Django command: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Django server stopped")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
