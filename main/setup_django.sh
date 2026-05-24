#!/bin/bash

# Django Backend Setup Script for Video Analysis

echo "🚀 Setting up Django Video Analysis Backend..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

echo "📁 Working in: $DIR"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📋 Installing Django dependencies..."
pip install -r requirements.txt

# Run Django migrations
echo "🗄️  Setting up Django database..."
python manage.py migrate

# Create superuser (optional)
echo ""
echo "👑 Would you like to create a Django admin superuser? (y/n)"
read -r create_superuser
if [ "$create_superuser" = "y" ] || [ "$create_superuser" = "Y" ]; then
    python manage.py createsuperuser
fi

echo ""
echo "✅ Django setup complete!"
echo ""
echo "🚀 To start the Django server:"
echo "   python start_django.py"
echo ""
echo "🌐 Django will be available at:"
echo "   - Main site: http://localhost:8000"
echo "   - Admin panel: http://localhost:8000/admin"
echo "   - API endpoints: http://localhost:8000/app/"
echo ""
echo "📁 Your Next.js frontend should call these Django APIs for video analysis."
