# 🚀 U-Speak Pro - AI Communication Analysis Platform

> Advanced AI-powered video and audio analysis for communication improvement, body language assessment, and presentation skills enhancement.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js)](https://nextjs.org/)
[![Django](https://img.shields.io/badge/Django-4.2+-green?logo=django)](https://www.djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green?logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue?logo=typescript)](https://www.typescriptlang.org/)

![U-Speak Pro Dashboard](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=U-Speak+Pro+Dashboard)

## ✨ Features

### 🎥 **Video Analysis**
- **AI-powered transcription** with OpenAI Whisper
- **Real-time pose detection** using MediaPipe
- **Voice analysis** with pitch, tone, and pace evaluation
- **Content analysis** with NLP processing

### 📊 **Business Metrics System**
- **Dynamic Business Unit Assignment** - Automatically assigns metrics to correct business units based on employee assignments
- **Real-time Performance Tracking** - Live updates of communication metrics across organizations
- **Automated Triggers** - Automatic metric recalculation after video analysis completion
- **Multi-level Analytics** - Individual, team, and organizational performance insights
- **Historical Data Storage** - Persistent metrics storage with version control and audit trails

---

## 🔄 **Business Metrics Flow**

### **1. Video Upload & Analysis**
```
User Uploads Video → AI Analysis Pipeline → Metrics Calculated
```

### **2. Employee Attribution**
```
Employee Profile → User ID Mapping → Business Unit Assignment
```

### **3. Metric Aggregation**
```
Individual Video Scores → Business Unit Aggregation → Performance Insights
```

### **4. Data Storage & Retrieval**
```
Calculated Metrics → MongoDB Storage → API Endpoints → Dashboard Display
```

### **Detailed Flow Architecture**

#### **📥 Data Ingestion**
1. **Video Upload**: Users upload communication videos through the platform
2. **AI Processing**: Videos are processed using:
   - **OpenAI Whisper**: Speech-to-text transcription
   - **MediaPipe**: Body language and pose analysis
   - **Voice Analysis**: Tone, pitch, and pacing evaluation
   - **NLP Processing**: Content quality assessment

#### **👥 Employee Mapping**
1. **Profile Lookup**: System identifies the user who uploaded the video
2. **Business Assignment**: Maps user to their assigned business unit via employee profiles
3. **Organization Context**: Captures region, zone, batch, and branch information

#### **📊 Metric Calculation**
1. **Individual Scores**: Each video generates scores for:
   - **Body Language** (eye contact, gestures, posture)
   - **Vocal Tone** (modulation, clarity, pacing)
   - **Word Power** (vocabulary, fluency, structure)
   - **Overall Performance** (combined assessment)

2. **Improvement Tracking**: Calculates improvement rates by comparing multiple videos from the same user

3. **Business Aggregation**: Combines individual metrics into business unit performance indicators

#### **💾 Data Storage**
1. **Real-time Storage**: Metrics automatically saved to `businessmetrics` collection
2. **Version Control**: Each calculation includes timestamp and version metadata
3. **Audit Trail**: Complete history of metric changes and calculations

#### **📡 API Endpoints**
1. **Business Metrics API** (`/api/business-metrics-by-units`):
   - Reads from stored collection for fast response
   - Falls back to calculation if data is missing
   - Returns aggregated metrics by business unit

2. **Admin Trigger API** (`/api/admin/business-metrics-trigger`):
   - Manual recalculation for administrators
   - Batch processing capabilities
   - Scheduled calculation support

#### **📈 Dashboard Integration**
1. **Real-time Display**: Admin dashboard shows live metrics
2. **Performance Charts**: Visual representation of improvement trends
3. **Business Intelligence**: Comparative analysis across business units
4. **Export Capabilities**: PDF reports and data export functionality

### **Key Components**

#### **Business Wise Data Calculator** (`lib/services/business-wise-data-calculator.ts`)
- Core calculation engine for business unit metrics
- Handles employee-to-user ID mapping
- Aggregates video analysis data
- Calculates improvement rates and averages

#### **Metrics Trigger Service** (`lib/services/business-metrics-trigger.ts`)
- Automatic calculation triggers
- Database storage management
- Cron job scheduling support
- Error handling and logging

#### **Database Collections**
- **`businessunits`**: Business unit definitions and employee assignments
- **`employeeprofiles`**: Employee data with user ID mappings
- **`video_analysis`**: Individual video analysis results
- **`businessmetrics`**: Aggregated business unit performance data

### **Automatic Triggers**
- **Video Analysis Completion**: Triggers metric recalculation
- **Employee Assignment Changes**: Updates business unit metrics
- **Scheduled Recalculation**: Daily/weekly batch processing
- **Manual Triggers**: Admin-initiated recalculations

### **Performance Features**
- **Fast Response Times**: Pre-calculated metrics from database
- **Scalable Architecture**: Handles multiple business units efficiently
- **Real-time Updates**: Automatic recalculation after new data
- **Data Consistency**: Single source of truth for metrics

---

## 🚀 Quick Start

### **One-Click Setup** (Recommended)
```bash
# Automated setup script
chmod +x setup.sh
./setup.sh
```

### **Interactive Setup**
```bash
# User-friendly guided setup
node setup.js
```

### **Start Development Server**
```bash
# Start both frontend and backend
./start-dev.sh

# Or start individually
npm run dev              # Frontend (port 3000)
npm run start:django     # Backend (port 8000)
```

### **Access Application**
- 🌐 **Frontend**: http://localhost:3000
- ⚙️ **Backend API**: http://localhost:8000
- 👨‍💻 **Admin Panel**: http://localhost:8000/admin

---

## 📋 Requirements

### **Core Requirements**
- **Node.js** v18+ - [Download](https://nodejs.org/)
- **Python** 3.8+ - [Download](https://python.org/)
- **MongoDB** 5.0+ - [Installation Guide](#mongodb-setup)

### **Optional (for enhanced features)**
- **Docker** - For containerized MongoDB
- **FFmpeg** - For advanced video processing
- **Git** - For version control

---

## 📦 Installation Options

### **Option 1: Automated Setup (5 minutes)**
```bash
# Clone repository
git clone <repository-url>
cd "U-Speak-inter_tanish_desktop 8"

# Run automated setup
./setup.sh

# Start development server
./start-dev.sh
```

### **Option 2: Manual Installation**

#### **Frontend Setup**
```bash
# Install Node.js dependencies
npm install

# Setup environment
cp env.example .env.local
# Edit .env.local with your configuration
```

#### **Backend Setup**
```bash
# Navigate to Django backend
cd main

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Setup Django environment
python manage.py migrate
```

#### **Database Setup**
```bash
# Option A: Local MongoDB
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Option B: Docker MongoDB
docker-compose up -d
```

---

## 🛠️ Development Commands

### **Package.json Scripts**
```bash
npm run setup              # Interactive setup wizard
npm run setup:auto         # Automated setup script
npm run setup:backend      # Python environment setup
npm run setup:frontend     # Node.js dependencies

npm run dev                # Start Next.js development server
npm run start:django       # Start Django backend
npm run start:both         # Start both frontend and backend
npm run start:dev          # Start with custom script

npm run build              # Build for production
npm run test:all           # Run all tests
npm run clean              # Clean all dependencies
npm run docker:up          # Start Docker services
```

### **Django Management**
```bash
# Database operations
npm run migrate            # Run migrations
npm run makemigrations     # Create migrations
npm run createsuperuser    # Create admin user
npm run collectstatic      # Collect static files

# Testing and debugging
npm run test:backend       # Run Django tests
cd main && python manage.py shell  # Django shell
```

---

## 🏗️ Project Structure

```
U-Speak-inter_tanish_desktop 8/
├── 📂 app/                    # Next.js App Router
│   ├── 📂 api/               # API routes
│   ├── 📂 dashboard/         # Dashboard pages
│   ├── 📂 videos/            # Video analysis pages
│   └── 📄 layout.tsx         # Root layout
│
├── 📂 components/             # React Components
│   ├── 📂 analysis/          # Analysis components
│   ├── 📂 dashboard/         # Dashboard components
│   ├── 📂 videos/            # Video components
│   └── 📂 ui/                # UI components
│
├── 📂 main/                   # Django Backend
│   ├── 📂 analyzer/          # Video analysis engine
│   ├── 📂 media_analyzer/    # MediaPipe processing
│   ├── 📂 app/               # Django apps
│   ├── 📄 requirements.txt   # Python dependencies
│   └── 📄 manage.py          # Django management
│
├── 📂 lib/                    # Utility libraries
├── 📂 hooks/                  # React hooks
├── 📂 types/                  # TypeScript definitions
├── 📂 public/                 # Static assets
│
├── 📄 package.json            # Node.js configuration
├── 📄 setup.sh               # Automated setup script
├── 📄 setup.js               # Interactive setup
├── 📄 docker-compose.yml     # Docker configuration
├── 📄 SETUP_GUIDE.md         # Detailed setup guide
└── 📄 QUICK_START.md         # Quick start guide
```

---

## 🔧 Configuration

### **Environment Variables (.env.local)**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/uspeak-pro

# Authentication
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# AI APIs (Optional)
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Features
ENABLE_AI_TRANSCRIPTION=true
ENABLE_POSE_ANALYSIS=true
ENABLE_VOICE_ANALYSIS=true
ENABLE_GEMINI_ENHANCEMENT=true
```

### **AI API Keys Setup**
For enhanced AI features, obtain API keys:

1. **Google Gemini**: https://makersuite.google.com/app/apikey
2. **OpenAI**: https://platform.openai.com/api-keys
3. **Google Cloud**: https://console.cloud.google.com/

See [API_KEYS_SETUP.md](./API_KEYS_SETUP.md) for detailed instructions.

---

## 🐳 Docker Support

### **Quick Start with Docker**
```bash
# Start all services including MongoDB
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Services Included**
- **MongoDB**: Database service (port 27017)
- **Mongo Express**: Web UI for MongoDB (port 8081)
- **Network**: Isolated docker network for services

---

## 🧪 Testing

### **Run All Tests**
```bash
npm run test:all
```

### **Individual Test Suites**
```bash
# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend

# Django specific tests
cd main && python manage.py test
```

---

## 🚀 Production Deployment

### **Build for Production**
```bash
# Build Next.js application
npm run build

# Collect Django static files
npm run collectstatic

# Start production servers
npm start                    # Next.js production server
cd main && gunicorn main.wsgi:application  # Django production server
```

### **Production Environment**
- Set `DEBUG=False` in Django settings
- Use production MongoDB instance
- Configure proper CORS settings
- Set up SSL certificates
- Use environment variables for secrets

---

## 📊 Performance Features

### **Analysis Capabilities**
- ✅ Real-time video processing
- ✅ Multi-threaded analysis pipeline
- ✅ Efficient pose detection
- ✅ Voice pattern recognition
- ✅ NLP content analysis
- ✅ Emotion detection
- ✅ Performance benchmarking

### **Technical Specifications**
- **Video Formats**: MP4, AVI, MOV, MKV
- **Audio Formats**: MP3, WAV, M4A
- **Max File Size**: 100MB (configurable)
- **Processing Time**: ~30 seconds for 5-minute video
- **Accuracy**: 90%+ for pose detection, 85%+ for voice analysis

---

## 🤝 Contributing

### **Development Setup**
```bash
# Clone repository
git clone <repository-url>
cd "U-Speak-inter_tanish_desktop 8"

# Setup development environment
npm run setup

# Start development server
npm run start:both
```

### **Code Style**
- **Frontend**: ESLint + Prettier for TypeScript/React
- **Backend**: Black + flake8 for Python
- **Commits**: Conventional commit messages

---

## 📄 Documentation

- 📖 **[Setup Guide](./SETUP_GUIDE.md)** - Comprehensive installation instructions
- 🚀 **[Quick Start](./QUICK_START.md)** - Get up and running in 5 minutes
- 🔑 **[API Keys Setup](./API_KEYS_SETUP.md)** - Configure AI services
- 🐳 **[Docker Guide](./DOCKER_GUIDE.md)** - Container deployment
- 📊 **[Architecture](./ARCHITECTURE.md)** - System design overview

---

## 🆘 Troubleshooting

### **Common Issues**

**Port conflicts:**
```bash
# Kill processes on ports 3000 and 8000
sudo lsof -t -i tcp:3000 | xargs kill -9
sudo lsof -t -i tcp:8000 | xargs kill -9
```

**MongoDB connection issues:**
```bash
# Check MongoDB status
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb/brew/mongodb-community
```

**Python virtual environment issues:**
```bash
# Recreate virtual environment
cd main
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI Whisper** for speech recognition
- **MediaPipe** for pose detection
- **Google Gemini** for AI enhancement
- **Next.js** and **Django** communities
- **Tailwind CSS** for styling
- **Radix UI** for component primitives

---

## 📞 Support

- 📧 **Email**: support@uspeak-pro.com
- 💬 **Discord**: Join our community
- 🐛 **Issues**: GitHub Issues
- 📖 **Documentation**: In-project guides

---

<div align="center">

**Built with ❤️ for better communication**

⭐ **Star this repo** if you find it helpful!

</div>

## 🚀 Features

### Core Functionality
- **Corporate Account Management** - Multi-tenant architecture for companies
- **Employee Management** - CRUD operations with custom attributes
- **License Assignment** - USpeak Pro license management
- **Learning Assignments** - Custom training paths and progress tracking
- **Advanced Analytics** - Individual and aggregate performance insights
- **Bulk Operations** - CSV/Excel uploads for employee data
- **Audit Logging** - Complete compliance and traceability

### Technical Features
- **Next.js 15** with TypeScript
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with role-based access control
- **Responsive Design** with Tailwind CSS
- **Form Validation** with React Hook Form + Zod
- **Modern UI Components** with Radix UI

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcryptjs
- **Forms**: React Hook Form, Zod validation
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB Installation

#### macOS (using Homebrew)
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Verify MongoDB is running
brew services list | grep mongodb
```

#### Windows
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Start MongoDB service from Windows Services

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: MongoDB Atlas (Cloud)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update your `.env.local` file with the Atlas connection string

### Option 3: Docker (Recommended for Development)

#### Quick Start with Docker Compose
```bash
# Start MongoDB and Mongo Express
./start-mongodb.sh

# Or manually with Docker Compose
docker-compose up -d
```

#### What's Included
- **MongoDB 7.0** running on port 27017
- **Mongo Express** web UI on port 8081 (admin/password123)
- **Automatic database initialization** with collections and indexes
- **Persistent data storage** using Docker volumes

#### Docker Commands
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f mongodb

# Stop services
docker-compose down

# Reset database (removes all data)
docker-compose down -v
```

### Verify MongoDB Connection
```bash
# Connect to MongoDB shell
mongosh

# Or check if the service is running
ps aux | grep mongod
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd U-Speak-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment template and configure your settings:
```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/uspeak-pro

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 4. Database Setup
Ensure MongoDB is running and accessible at your configured URI.

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

### Collections

#### CorporateAccount
- Company information and subscription details
- Custom attribute definitions
- Account status and limits

#### User
- Authentication and role management
- Links to corporate account
- Password hashing and security

#### EmployeeProfile
- Employee-specific information
- Custom attribute values
- Department and role details

#### License
- USpeak Pro license management
- Assignment tracking
- Feature access control

#### AuditLog
- Complete action logging
- Compliance and traceability
- Security monitoring

## 🔐 Authentication Flow

1. **Registration**: Corporate admins create accounts
2. **Login**: JWT-based authentication
3. **Role-based Access**: Admin vs Employee permissions
4. **Route Protection**: Middleware-based security
5. **Token Management**: Secure storage and validation

## 📱 User Interface

### Authentication Pages
- **Login Form**: Corporate admin sign-in
- **Registration Form**: New company account creation
- **Responsive Design**: Works on desktop and mobile

### Dashboard (Protected Routes)
- Employee management
- License assignment
- Progress tracking
- Analytics and reporting

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication
- **Route Protection**: Middleware-based security
- **Input Validation**: Zod schema validation
- **Audit Logging**: Complete action tracking
- **Role-based Access**: Granular permissions

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Corporate account creation

### Protected Routes
- All other routes require valid JWT token
- User context available in request headers

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Secure production secrets
2. **Database**: Use MongoDB Atlas or production instance
3. **JWT Secret**: Generate strong, unique secret
4. **HTTPS**: Enable SSL/TLS encryption
5. **Rate Limiting**: Implement API rate limiting

### Build Commands
```bash
npm run build
npm start
```

## 🧪 Testing

```bash
npm run lint
npm run build
```

## 📝 License

This project is proprietary software for USpeak Pro platform.

## 🤝 Support

For technical support or questions, please contact the development team.

---

**Note**: This is a corporate B2B platform. Ensure proper security measures and compliance with data protection regulations (GDPR, etc.) before production deployment.
