'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  Eye, 
  Calendar, 
  Clock, 
  User,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Mic,
  Users
} from 'lucide-react';

interface VideoReportProps {
  video: {
    id: string;
    title: string;
    speaker: string;
    uploadDate: string;
    duration: string;
    overallScore: number;
    bodyLanguageScore: number;
    vocalToneScore: number;
    wordPowerScore: number;
    thumbnail?: string;
  };
  onClose: () => void;
}

export function VideoReport({ video, onClose }: VideoReportProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 70) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  const CircularProgress = ({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ${getScoreColor(score)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Video Title - Enhanced */}
      <div className="mb-12">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-fade-in-down">
          {video.title}
        </h1>
        <div className="flex items-center space-x-8 text-gray-500 animate-fade-in-up">
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <User className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">{video.speaker}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-sm">{new Date(video.uploadDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-sm">{video.duration}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* Video Player - Modern Minimalist */}
        <div className="xl:col-span-3">
          <Card className="overflow-hidden rounded-3xl shadow-xl border-0 bg-white/80 backdrop-blur-xl">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Video Analysis</h3>
                  <p className="text-gray-500 text-sm mt-1">AI-powered communication insights</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Live Analysis</span>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="relative bg-gradient-to-br from-gray-900 to-black aspect-video group">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover rounded-b-3xl transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="text-4xl">🎬</div>
                      </div>
                      <div className="text-xl font-medium">Video Preview</div>
                      <div className="text-gray-400 text-sm">Click to start analysis</div>
                    </div>
                  </div>
                )}
                
                {/* Modern Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    size="icon"
                    className="bg-white/90 hover:bg-white text-gray-900 border-0 rounded-full w-16 h-16 shadow-2xl transition-all duration-300 transform hover:scale-110"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </Button>
                </div>

                {/* Floating Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:bg-white/20 backdrop-blur-sm rounded-full"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <div className="flex-1 space-y-1">
                      <Progress value={(currentTime / 100) * 100} className="h-1.5 bg-white/20" />
                      <div className="flex justify-between text-xs text-white/80">
                        <span>2:34</span>
                        <span>{video.duration}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-5 h-5 text-white" />
                      <Progress value={volume} className="w-20 h-1.5 bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card - Premium Minimalist */}
        <div className="xl:col-span-1">
          <Card className="h-full shadow-2xl border-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden rounded-3xl">
            {/* Subtle Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
            
            <CardContent className="p-8 relative z-10 h-full flex flex-col">
              <div className="text-center space-y-8 flex-1">
                {/* User Profile */}
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-3 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">{video.speaker}</h3>
                    <p className="text-gray-600 text-sm font-medium">Communication Analyst</p>
                  </div>
                </div>

                {/* Overall Score - Clean Design */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {video.overallScore}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Overall Score</div>
                    </div>
                    
                    {/* Progress Ring */}
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200" />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            strokeDasharray="176"
                            strokeDashoffset={176 - (video.overallScore / 100) * 176}
                            className="text-blue-500 transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">{video.overallScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats - Minimal Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <Mic className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-gray-600">Vocal</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{video.vocalToneScore}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-gray-600">Words</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{video.wordPowerScore}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-gray-600">Body</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{video.bodyLanguageScore}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-medium text-gray-600">WPM</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">145</div>
                  </div>
                </div>
              </div>

              {/* Download Button - Elegant */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 mt-6"
                onClick={() => {/* Handle download */}}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transcript Section */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📝</span>
            <span className="font-semibold text-lg">Transcript</span>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-gray-800 mb-4">Full Transcript</h4>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="mb-4">
                    "Good morning everyone, and thank you for joining today's quarterly sales presentation. 
                    I'm excited to share our achievements and discuss our strategic direction for the upcoming quarter."
                  </p>
                  <p className="mb-4">
                    "As you can see from the data, we've exceeded our targets by 15% this quarter, 
                    which demonstrates the effectiveness of our new customer engagement strategies."
                  </p>
                  <p className="mb-4">
                    "Moving forward, we'll be focusing on three key areas: customer retention, 
                    market expansion, and product innovation. Each of these pillars will contribute 
                    to our continued growth and success."
                  </p>
                </div>
              </div>

              {/* <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
                <h4 className="font-semibold text-gray-800 mb-4">🔍 Sentence Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <span className="text-gray-700">Opening greeting and presentation introduction</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <span className="text-gray-700">Performance results and achievement highlights</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <span className="text-gray-700">Future strategy and key focus areas</span>
                  </div>
                </div>
              </div> */}

              <div className="text-center">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3 rounded-xl shadow-lg">
                  <Download className="w-5 h-5 mr-2" />
                  📄 Download Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grammar Corrected Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">📝</span>
            <span>Grammar Corrected</span>
          </h3>
          <div className="text-sm text-gray-500">AI Generated</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600 mb-2">Text in red shows grammar corrections</div>
        </div>
        
        <div className="bg-white rounded-lg p-6 space-y-4">
          <p className="text-gray-800 leading-relaxed">
            Good afternoon, everyone. I'd like to briefly introduce myself. My name is Vinny, and I'm originally from Delhi. I've worked for almost 18 years in various industries, 
            primarily with high-end luxury <span className="bg-red-100 text-red-800 px-1 rounded">brands</span>. I've worked with Chanel, Ferragamo, and even a furniture brand called Febal, which you might be familiar with. More recently, I 
            joined Santa Hansa. Santa Hansa <span className="bg-red-100 text-red-800 px-1 rounded">joined</span> me as a senior store manager. I'm looking after a Solapur metro station, Legacy store where we have a wide range of 
            <span className="bg-red-100 text-red-800 px-1 rounded">bedspreads</span>, <span className="bg-red-100 text-red-800 px-1 rounded">cushions</span>, and luxury bed covers. I truly enjoy working at the store because I'm a very colorful person, and the store's vibrant palette appeals to me. My 
            passion is sales. It's ingrained in me. I believe I can sell anything to anyone, thanks to the extensive exposure, experience, and training I've gained from working in 
            <span className="bg-red-100 text-red-800 px-1 rounded">different industries</span>. Regarding my strengths and weaknesses, I'm a very quick learner. As for <span className="bg-red-100 text-red-800 px-1 rounded">weaknesses</span>, I wouldn't necessarily say I have any, as I consistently 
            work hard to improve myself. However, that dedication could be perceived as a <span className="bg-red-100 text-red-800 px-1 rounded">weakness</span>. Finally, I love to travel. Whenever I have the opportunity, even if it's just for 
            a day, I'll take a trip, traveling is definitely one of my hobbies.
          </p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">📋</span>
            <span>Summary</span>
          </h3>
          <div className="text-sm text-gray-500">AI Generated</div>
        </div>
        
        <div className="bg-white rounded-lg p-6 space-y-6">
          {/* Personal Interests */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Personal Interests</span>
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Vinny loves to travel</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Takes trips whenever possible, even for just a day</span>
              </li>
            </ul>
          </div>

          {/* Critical Insights */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Critical Insights</span>
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Vinny's extensive experience with high-end luxury brands positions him as a valuable asset in retail</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>His self-described dedication to improvement, while potentially perceived as a weakness, demonstrates a strong work ethic</span>
              </li>
            </ul>
          </div>

          {/* Implementation/Next Steps */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Implementation/Next Steps</span>
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Leverage Vinny's experience and passion for sales to drive store performance</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Encourage Vinny to share his insights and experiences with the team to foster a culture of continuous improvement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Keywords Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">🔑</span>
            <span>Keywords</span>
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">luxury brand</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">high-end furniture</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">Santa Hansa</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">store manager</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">Solapur metro station</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">bed covers</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">accessories</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">cushions</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">selling</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">quick learner</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">travel</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">Chanel</span>
        </div>
      </div>

      {/* Repeated Words Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🔄</span>
            <span className="font-semibold text-lg">Repeated Words Analysis</span>
          </div>
          <p className="text-gray-600 mt-2">Words that appear frequently in your speech. Variety in vocabulary can make your message more engaging</p>
        </div>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 italic">
                These words appear frequently in your speech. Consider using synonyms for variety.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { word: 'work', count: 8 },
                { word: 'store', count: 6 },
                { word: 'like', count: 5 },
                { word: 'sell', count: 4 },
                { word: 'different', count: 4 },
                { word: 'really', count: 3 },
                { word: 'much', count: 3 },
                { word: 'travel', count: 3 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <span className="font-medium text-gray-800">{item.word}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filler Words Detection */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">⚠️</span>
            <span className="font-semibold text-lg">Filler Words Detection</span>
          </div>
          <p className="text-gray-600 mt-2">Words that may reduce the clarity and impact of your message. Minimizing these can improve your delivery</p>
        </div>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="bg-orange-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 italic">
                These are filler words that appear in your speech. Reducing them can make your delivery more impactful.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { word: 'so', percentage: '3.7%', count: 16 },
                { word: 'like', percentage: '1.8%', count: 8 },
                { word: 'just', percentage: '1.2%', count: 5 },
                { word: 'you know', percentage: '0.8%', count: 4 },
                { word: 'basically', percentage: '0.4%', count: 2 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <span className="font-medium text-gray-800">{item.word}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{item.percentage}</span>
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Sentiment Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">😊</span>
            <span className="font-semibold text-lg">Sentiment Analysis</span>
          </div>
          <p className="text-gray-600 mt-2">Analysis of the emotional tone of your content</p>
        </div>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">😊</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Overall Sentiment: POSITIVE</h3>
                  <p className="text-gray-600">Confidence: 99.9%</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Positive</span>
                <div className="flex items-center space-x-2">
                  <div className="w-64 bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '99.9%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-green-600">99.9%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Negative</span>
                <div className="flex items-center space-x-2">
                  <div className="w-64 bg-gray-200 rounded-full h-3">
                    <div className="bg-red-500 h-3 rounded-full" style={{ width: '0.1%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-red-600">0.1%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Neutral</span>
                <div className="flex items-center space-x-2">
                  <div className="w-64 bg-gray-200 rounded-full h-3">
                    <div className="bg-gray-500 h-3 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-600">0%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emotion Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎭</span>
            <span className="font-semibold text-lg">Emotion Analysis</span>
          </div>
          <p className="text-gray-600 mt-2">Detailed emotion categorization based on NLP & Social Media Models</p>
        </div>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">😊</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Joy / Happiness</h3>
                  <p className="text-gray-600">Confidence: 90%</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 italic">
                  Your content expresses positive emotions, cheerfulness, and enthusiasm.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Detected Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800">love</Badge>
                  <Badge className="bg-blue-100 text-blue-800">enjoy</Badge>
                  <Badge className="bg-blue-100 text-blue-800">great</Badge>
                  <Badge className="bg-blue-100 text-blue-800">best</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Emotion Breakdown:</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-500">😊</span>
                      <span className="text-sm font-medium">Joy / Happiness</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <span className="text-sm font-bold">90%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-500">❤️</span>
                      <span className="text-sm font-medium">Love</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                      <span className="text-sm font-bold">50%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Strength Progress */}
      <div className="space-y-8">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">💪</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Overall Strength</h3>
                  <p className="text-gray-600">Your content shows strength in several important areas</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-600">77.1%</div>
                <Badge className="bg-green-100 text-green-800 mt-2">Good</Badge>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div className="bg-green-500 h-4 rounded-full" style={{ width: '77.1%' }}></div>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Good - Your content shows strength in several important areas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Analysis Summary */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-lg">Content Analysis Summary</span>
          </div>
          <p className="text-gray-600 mt-2">Based on vocabulary, fluency, sentence structure, and other metrics</p>
        </div>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">😊</span>
                <span className="text-sm font-medium">Sentiment</span>
              </div>
              <Badge className="bg-green-100 text-green-800">POSITIVE tone (99.9% confidence)</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">😊</span>
                <span className="text-sm font-medium">Dominant Emotion</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Joy / Happiness (50% confidence)</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">🌟</span>
                <span className="text-sm font-medium">Content Quality</span>
              </div>
              <Badge className="bg-green-100 text-green-800">82.5% overall quality score</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-blue-500">📚</span>
                <span className="text-sm font-medium">Vocabulary Diversity</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">45.5% unique words</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-purple-500">🍭</span>
                <span className="text-sm font-medium">Complexity Level</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Basic</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">👌</span>
                <span className="text-sm font-medium">Overall Strength</span>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800">77.1% content strength</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-green-600">✅</span>
                <span className="text-sm font-medium">Top Strength</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Vocabulary - Strong vocabulary diversity with 45.5% unique words</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-orange-600">🧑‍💻</span>
                <span className="text-sm font-medium">Key Improvement</span>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Content Length - Consider adding approximately 32 more words for better depth</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm font-medium">Speaking Fluency</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">2.61% filler words detected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-blue-600">✏️</span>
                <span className="text-sm font-medium">Sentence Structure</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Average 10.3 words per sentence</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-pink-600">🔁</span>
                <span className="text-sm font-medium">Most Repeated Word</span>
              </div>
              <Badge className="bg-pink-100 text-pink-800">"work" used 5 times</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-orange-600">🗣️</span>
                <span className="text-sm font-medium">Top Filler Word</span>
              </div>
              <Badge className="bg-orange-100 text-orange-800">"so" (3.7% of content)</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-500">📏</span>
                <span className="text-sm font-medium">Content Length</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">269 words total</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Content Analysis & Recommendations */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🤖</span>
            <span className="font-semibold text-lg">Advanced Content Analysis & Recommendations</span>
          </div>
          <p className="text-gray-600 mt-2">Comprehensive analysis with detailed recommendations based on NLP metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strengths */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-800">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✅</span>
                  <span>Strengths</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-semibold text-gray-800">Vocabulary</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">85.5%</Badge>
                </div>
                <p className="text-sm text-gray-600">Strong vocabulary diversity with 45.5% unique words</p>
              </div>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-800">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <span>Areas for Improvement</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">▲</span>
                    <span className="font-semibold text-gray-800">Content Length</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">68.3%</Badge>
                </div>
                <p className="text-sm text-gray-600">Consider adding approximately 32 more words for better depth</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">▲</span>
                    <span className="font-semibold text-gray-800">Fluency</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">69.6%</Badge>
                </div>
                <p className="text-sm text-gray-600">Reduce filler words (like, just, basically) which make up 2.81% of content</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">▲</span>
                    <span className="font-semibold text-gray-800">Flow & Cohesion</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Add more transition words to improve flow between ideas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Word Power Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">💬</span>
            <span className="font-semibold text-lg">Word Power Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-0 shadow-xl h-full flex flex-col justify-center items-center">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="relative flex flex-col items-center justify-center" style={{ width: 120, height: 120 }}>
                    {/* keep only the circular/rounded score */}
                    <CircularProgress score={72} size={120} strokeWidth={10} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600">72</div>
                        <div className="text-sm text-gray-500">out of 100</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Badge className="inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-yellow-100 text-yellow-800 px-4 py-2">
                      Good
                    </Badge>
                  </div>
                </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💪</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Word Power Insights</h4>
                    <p className="text-sm text-gray-600">
                      Your Word Power is good. Identify the areas that can enhance your score.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 h-full">
                <Card className="bg-white border border-gray-200 h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span className="text-2xl">📝</span>
                      <span>Word Categories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                          <span className="font-medium">Positive</span>
                        </span>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1">Good</Badge>
                      </div>
                      <Progress value={75} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                          <span className="font-medium">Neutral</span>
                        </span>
                        <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">Average</Badge>
                      </div>
                      <Progress value={60} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                          <span className="font-medium">Negative</span>
                        </span>
                        <Badge className="bg-red-100 text-red-800 px-3 py-1">Poor</Badge>
                      </div>
                      <Progress value={25} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base flex items-center space-x-2">
                          <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                          <span className="font-medium">Repetition</span>
                        </span>
                        <Badge className="bg-red-100 text-red-800 px-3 py-1">Poor</Badge>
                      </div>
                      <Progress value={30} className="h-3" />
                    </div>
                    <div className="flex-1"></div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-green-50 border border-green-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-800">✅ Strengths</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">• Clear articulation</div>
                    <div className="text-sm">• Good vocabulary range</div>
                    <div className="text-sm">• Effective emphasis</div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-orange-800">⚠️ Areas to Improve</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">• Reduce filler words</div>
                    <div className="text-sm">• Vary sentence structure</div>
                    <div className="text-sm">• Minimize repetition</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <Card className="bg-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">85.5%</div>
              <div className="text-sm font-semibold text-gray-800">Vocabulary</div>
              <div className="text-xs text-gray-500">45.5% unique words</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">69.6%</div>
              <div className="text-sm font-semibold text-gray-800">Fluency</div>
              <div className="text-xs text-gray-500">2.81% filler words</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">76.9%</div>
              <div className="text-sm font-semibold text-gray-800">Sentence Structure</div>
              <div className="text-xs text-gray-500">~5.3 words/sentence</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">89.3%</div>
              <div className="text-sm font-semibold text-gray-800">Content Length</div>
              <div className="text-xs text-gray-500">Good depth</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Overview */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-lg">Communication Scores</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Body Language */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <div className="mb-6">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Body Language
                </h3>
              </div>
              <div className="relative flex flex-col items-center justify-center" style={{ width: 120, height: 120 }}>
                <CircularProgress score={video.bodyLanguageScore} size={120} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{video.bodyLanguageScore}</div>
                    <div className="text-sm text-gray-500">out of 100</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Badge className={`inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 ${getScoreColor(video.bodyLanguageScore)} bg-opacity-10 px-4 py-2`}>
                  {video.bodyLanguageScore >= 80 ? 'Excellent' : video.bodyLanguageScore >= 70 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Vocal Tone */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-xl h-full flex flex-col justify-center items-center">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                <div className="mb-6">
                  <div className="text-6xl font-bold text-purple-600 mb-2">4.3</div>
                  <div className="text-lg text-gray-600">out of 5</div>
                </div>
                <div className="relative flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
                  <CircularProgress score={86} size={100} strokeWidth={8} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">86</div>
                      <div className="text-sm text-gray-500">out of 100</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    🎯 Best Part of Speech - Great
                  </div>
                </div>
                <div className="mt-4 space-y-2 w-full">
                  <div className="flex justify-between text-sm">
                    <span>Avg Pace</span>
                    <span className="font-semibold">Medium</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Tone</span>
                    <span className="font-semibold">Avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Word Power */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-0 shadow-xl h-full flex flex-col justify-center items-center">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center">
              <div className="mb-6">
                <div className="text-6xl font-bold text-pink-600 mb-2">3.6</div>
                <div className="text-lg text-gray-600">out of 5</div>
              </div>
              <div className="relative flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
                <CircularProgress score={72} size={100} strokeWidth={8} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">72</div>
                    <div className="text-sm text-gray-500">out of 100</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Badge className="inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-yellow-100 text-yellow-800 px-4 py-2">
                  Good
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confidence Metrics */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎯</span>
            <span className="font-semibold text-lg">Confidence Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-3xl mb-2">🧍</div>
                <h3 className="text-lg font-bold text-gray-800">Mostly Confident</h3>
              </div>
              <div className="text-5xl font-bold text-blue-600 mb-2">3.8</div>
              <div className="text-gray-600 mb-4">out of 5</div>
              <Progress value={76} className="h-3 mb-2" />
              <div className="text-sm text-gray-500">76% confidence level</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-bold text-gray-800">Low Engagement</h3>
              </div>
              <div className="text-5xl font-bold text-yellow-600 mb-2">2.4</div>
              <div className="text-gray-600 mb-4">out of 5</div>
              <Progress value={48} className="h-3 mb-2" />
              <div className="text-sm text-gray-500">48% engagement level</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-3xl mb-2">😐</div>
                <h3 className="text-lg font-bold text-gray-800">Not Nervous</h3>
              </div>
              <div className="text-5xl font-bold text-green-600 mb-2">1.2</div>
              <div className="text-gray-600 mb-4">out of 5</div>
              <Progress value={24} className="h-3 mb-2" />
              <div className="text-sm text-gray-500">Low nervousness detected</div>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Body Language Analysis */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 shadow-lg border border-emerald-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🤝</span>
            <span className="font-semibold text-lg">Body Language Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg h-full flex flex-col justify-center items-center">
              <div className="mb-4">
                <div className="text-5xl font-bold text-emerald-600 mb-2">0.9</div>
                <div className="text-lg text-gray-600">out of 5</div>
              </div>
              <div className="relative flex flex-col items-center justify-center mb-4" style={{ width: 100, height: 100 }}>
                <div className="relative" style={{ width: 100, height: 100 }}>
                  <svg width={100} height={100} className="transform -rotate-90">
                    <circle cx={50} cy={50} r={46} stroke="currentColor" strokeWidth={8} fill="none" className="text-gray-200" />
                    <circle cx={50} cy={50} r={46} stroke="currentColor" strokeWidth={8} fill="none" strokeDasharray={289.03} strokeDashoffset={237.00} className="transition-all duration-1000 text-red-600" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">18</div>
                      <div className="text-xs text-gray-500">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="inline-flex items-center rounded-full border text-xs font-semibold bg-red-100 text-red-800 px-3 py-1">Needs Improvement</div>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold mb-3 text-green-700 flex items-center text-sm">
                    <span className="text-lg mr-2">🌟</span>YOUR TOP AREAS
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center text-green-700">
                      <span className="mr-2">✅</span>Your posture looks good
                    </li>
                    <li className="flex items-center text-green-700">
                      <span className="mr-2">✅</span>Your hand movements are good
                    </li>
                    <li className="flex items-center text-green-700">
                      <span className="mr-2">✅</span>Your head movements look fine
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold mb-3 text-red-700 flex items-center text-sm">
                    <span className="text-lg mr-2">🎯</span>AREAS FOR IMPROVEMENT
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center text-red-700">
                      <span className="mr-2">🔴</span>You need to look at the camera more often
                    </li>
                    <li className="flex items-center text-red-700">
                      <span className="mr-2">🔴</span>You need to be more expressive
                    </li>
                    <li className="flex items-center text-red-700">
                      <span className="mr-2">🔴</span>Avoid looking down or sideways
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-green-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">😊</span>
                  <span className="font-semibold text-sm">Positive Facial Expression</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Surprise</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Happy</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">78%</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-red-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">😐</span>
                  <span className="font-semibold text-sm">Negative Facial Expression</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Neutral</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">12%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Sad</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">3%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Angry</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">2%</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-bold mb-3 text-sm flex items-center">
                  <span className="text-lg mr-2">📊</span>FREQUENCY ANALYSIS
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <span className="text-xs font-medium">Gaze</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">100%</span>
                      <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">Needs Work</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">👤</span>
                      <span className="text-xs font-medium">Head Position</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">74%</span>
                      <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">Needs Work</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🤲</span>
                      <span className="text-xs font-medium">Hand Movement</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">13%</span>
                      <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">Needs Work</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-bold mb-3 text-sm flex items-center">
                  <span className="text-lg mr-2">🏃</span>BODY POSTURE
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">Straight Posture</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">0%</span>
                      <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">Poor</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium">Shoulder Position</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">0%</span>
                      <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">Poor</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-xl">💡</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Insights</h4>
                  <p className="text-xs text-gray-600">
                    There are a number of areas in your body language that are having a negative impact. 
                    Review your report & try reflecting on these to move forward.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Vocal Tone Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎤</span>
            <span className="font-semibold text-lg">Vocal Tone Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-xl h-full">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="mb-6">
                  <div className="text-6xl font-bold text-purple-600 mb-2">4.3</div>
                  <div className="text-lg text-gray-600">out of 5</div>
                </div>
                <div className="relative flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
                  <CircularProgress score={86} size={100} strokeWidth={8} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">86</div>
                      <div className="text-sm text-gray-500">out of 100</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    🎯 Best Part of Speech - Great
                  </div>
                </div>
                <div className="mt-4 space-y-2 w-full">
                  <div className="flex justify-between text-sm">
                    <span>Avg Pace</span>
                    <span className="font-semibold">Medium</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Tone</span>
                    <span className="font-semibold">Avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Voice Insights</h4>
                    <p className="text-sm text-gray-600">
                      Your voice is strong and you are close to being on point. Work on your key improvement areas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* Speech Analysis Graphs Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h4 className="font-bold mb-4 flex items-center">
                    <span className="text-xl mr-2">📈</span>MODULATION
                  </h4>
                  <div className="h-48 flex items-center justify-center">
                    <svg width="100%" height="170" viewBox="0 0 300 170" className="text-blue-600">
                      <defs>
                        <linearGradient id="modulationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <g stroke="#e5e7eb" strokeWidth="1" opacity="0.3">
                        <line x1="40" y1="20" x2="280" y2="20"/>
                        <line x1="40" y1="50" x2="280" y2="50"/>
                        <line x1="40" y1="80" x2="280" y2="80"/>
                        <line x1="40" y1="110" x2="280" y2="110"/>
                        <line x1="40" y1="140" x2="280" y2="140"/>
                      </g>
                      
                      {/* Area chart */}
                      <path
                        d="M 40 100 L 70 85 L 100 95 L 130 70 L 160 80 L 190 75 L 220 65 L 250 78 L 280 60 L 280 140 L 40 140 Z"
                        fill="url(#modulationGradient)"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      
                      {/* Data points */}
                      <g fill="#3b82f6">
                        <circle cx="40" cy="100" r="3"/>
                        <circle cx="70" cy="85" r="3"/>
                        <circle cx="100" cy="95" r="3"/>
                        <circle cx="130" cy="70" r="3"/>
                        <circle cx="160" cy="80" r="3"/>
                        <circle cx="190" cy="75" r="3"/>
                        <circle cx="220" cy="65" r="3"/>
                        <circle cx="250" cy="78" r="3"/>
                        <circle cx="280" cy="60" r="3"/>
                      </g>
                      
                      {/* Y-axis labels */}
                      <g fill="#6b7280" fontSize="10" textAnchor="end">
                        <text x="35" y="25">100</text>
                        <text x="35" y="55">80</text>
                        <text x="35" y="85">60</text>
                        <text x="35" y="115">40</text>
                        <text x="35" y="145">20</text>
                      </g>
                      
                      {/* X-axis labels */}
                      <g fill="#6b7280" fontSize="10" textAnchor="middle">
                        <text x="40" y="160">0s</text>
                        <text x="100" y="160">20s</text>
                        <text x="160" y="160">40s</text>
                        <text x="220" y="160">60s</text>
                        <text x="280" y="160">80s</text>
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h4 className="font-bold mb-4 flex items-center">
                    <span className="text-xl mr-2">🎵</span>PITCH
                  </h4>
                  <div className="h-48 flex items-center justify-center">
                    <svg width="100%" height="170" viewBox="0 0 300 170" className="text-purple-600">
                      {/* Grid lines */}
                      <g stroke="#e5e7eb" strokeWidth="1" opacity="0.3">
                        <line x1="40" y1="20" x2="280" y2="20"/>
                        <line x1="40" y1="50" x2="280" y2="50"/>
                        <line x1="40" y1="80" x2="280" y2="80"/>
                        <line x1="40" y1="110" x2="280" y2="110"/>
                        <line x1="40" y1="140" x2="280" y2="140"/>
                      </g>
                      
                      {/* Line chart */}
                      <path
                        d="M 40 90 L 70 75 L 100 85 L 130 65 L 160 70 L 190 55 L 220 60 L 250 70 L 280 50"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      <g fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="2">
                        <circle cx="40" cy="90" r="4"/>
                        <circle cx="70" cy="75" r="4"/>
                        <circle cx="100" cy="85" r="4"/>
                        <circle cx="130" cy="65" r="4"/>
                        <circle cx="160" cy="70" r="4"/>
                        <circle cx="190" cy="55" r="4"/>
                        <circle cx="220" cy="60" r="4"/>
                        <circle cx="250" cy="70" r="4"/>
                        <circle cx="280" cy="50" r="4"/>
                      </g>
                      
                      {/* Y-axis labels */}
                      <g fill="#6b7280" fontSize="10" textAnchor="end">
                        <text x="35" y="25">160</text>
                        <text x="35" y="55">140</text>
                        <text x="35" y="85">120</text>
                        <text x="35" y="115">100</text>
                        <text x="35" y="145">80</text>
                      </g>
                      
                      {/* X-axis labels */}
                      <g fill="#6b7280" fontSize="10" textAnchor="middle">
                        <text x="40" y="160">0s</text>
                        <text x="100" y="160">20s</text>
                        <text x="160" y="160">40s</text>
                        <text x="220" y="160">60s</text>
                        <text x="280" y="160">80s</text>
                      </g>
                    </svg>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h4 className="font-bold mb-4 flex items-center">
                    <span className="text-xl mr-2">🔊</span>VOLUME
                  </h4>
                  <div className="h-48 flex items-center justify-center">
                    <svg width="100%" height="170" viewBox="0 0 300 170" className="text-green-600">
                      {/* Grid lines */}
                      <g stroke="#e5e7eb" strokeWidth="1" opacity="0.3">
                        <line x1="40" y1="20" x2="280" y2="20"/>
                        <line x1="40" y1="50" x2="280" y2="50"/>
                        <line x1="40" y1="80" x2="280" y2="80"/>
                        <line x1="40" y1="110" x2="280" y2="110"/>
                        <line x1="40" y1="140" x2="280" y2="140"/>
                      </g>
                      
                      {/* Bar chart */}
                      <g fill="#10b981">
                        <rect x="35" y="110" width="15" height="30" rx="2"/>
                        <rect x="65" y="95" width="15" height="45" rx="2"/>
                        <rect x="95" y="105" width="15" height="35" rx="2"/>
                        <rect x="125" y="80" width="15" height="60" rx="2"/>
                        <rect x="155" y="90" width="15" height="50" rx="2"/>
                        <rect x="185" y="70" width="15" height="70" rx="2"/>
                        <rect x="215" y="85" width="15" height="55" rx="2"/>
                        <rect x="245" y="75" width="15" height="65" rx="2"/>
                        <rect x="275" y="88" width="15" height="52" rx="2"/>
                      </g>
                      
                      {/* Y-axis labels */}
                      <g fill="#6b7280" fontSize="10" textAnchor="end">
                        <text x="30" y="25">70</text>
                        <text x="30" y="55">60</text>
                        <text x="30" y="85">50</text>
                        <text x="30" y="115">40</text>
                        <text x="30" y="145">30</text>
                      </g>
                      
                      {/* X-axis labels */}
                      <g fill="#6b7280" fontSize="10" textAnchor="middle">
                        <text x="42" y="160">0s</text>
                        <text x="102" y="160">20s</text>
                        <text x="162" y="160">40s</text>
                        <text x="222" y="160">60s</text>
                        <text x="282" y="160">80s</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Areas & Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-lg">
            <h4 className="font-bold mb-4 text-green-700 flex items-center">
              <span className="text-2xl mr-2">🌟</span>YOUR TOP AREAS
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center text-green-700">
                <span className="mr-2">✅</span>Your pitch is good
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✅</span>Your volume is good
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✅</span>Your pace is good
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-lg">
            <h4 className="font-bold mb-4 text-orange-700 flex items-center">
              <span className="text-2xl mr-2">🎯</span>AREAS FOR IMPROVEMENT
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center text-orange-700">
                <span className="mr-2">🔶</span>You need to work on your modulation
              </li>
              <li className="flex items-center text-orange-700">
                <span className="mr-2">🔶</span>Try to vary your pitch more
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pose & Voice Analysis */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">🎭</span>
            <span className="font-semibold text-lg">Pose & Voice Analysis</span>
          </div>
          <p className="text-gray-600 mt-2">Advanced body language and vocal analysis using MediaPipe and audio processing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gestures Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-center">
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm mb-2">GESTURES</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">1</div>
                  <div className="text-xs text-gray-600 mt-1">SMILES DETECTED</div>
                  <div className="text-sm font-semibold text-purple-600">(0.83%)</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">116</div>
                  <div className="text-xs text-gray-600 mt-1">HEAD MOVEMENTS</div>
                  <div className="text-sm font-semibold text-purple-600">(95.87%)</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs text-gray-600 mt-1">HAND MOVEMENTS</div>
                  <div className="text-sm font-semibold text-purple-600">(0.0%)</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">71</div>
                  <div className="text-xs text-gray-600 mt-1">EYE CONTACT</div>
                  <div className="text-sm font-semibold text-purple-600">(58.68%)</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs text-gray-600 mt-1">LEG MOVEMENTS</div>
                  <div className="text-sm font-semibold text-purple-600">(0.0%)</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs text-gray-600 mt-1">FOOT MOVEMENTS</div>
                  <div className="text-sm font-semibold text-purple-600">(0.0%)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Analysis Section */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-center">
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm mb-2">AUDIO PROCESSING</div>
                Voice Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">119.91s</div>
                  <div className="text-xs text-gray-600 mt-1">DURATION</div>
                  <div className="text-sm font-semibold text-indigo-600">Total Length</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">63.58 dB</div>
                  <div className="text-xs text-gray-600 mt-1">VOLUME</div>
                  <div className="text-sm font-semibold text-indigo-600">Average Volume</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">237.14 Hz</div>
                  <div className="text-xs text-gray-600 mt-1">MEAN PITCH</div>
                  <div className="text-sm font-semibold text-indigo-600">Average Pitch</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">75-600 Hz</div>
                  <div className="text-xs text-gray-600 mt-1">PITCH RANGE</div>
                  <div className="text-sm font-semibold text-indigo-600">Frequency Range</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">1</div>
                  <div className="text-xs text-gray-600 mt-1">PAUSES</div>
                  <div className="text-sm font-semibold text-indigo-600">Number of Pauses</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">119.84s</div>
                  <div className="text-xs text-gray-600 mt-1">SPEAKING TIME</div>
                  <div className="text-sm font-semibold text-indigo-600">Active Speaking</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-700">
              <strong>Note:</strong> This analysis uses MediaPipe for pose detection and facial analysis, and audio processing for vocal metrics to provide comprehensive presentation coaching.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Sections */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-lg">Summary & Key Insights</span>
          </div>
          <p className="text-gray-600 mt-2">Comprehensive overview of your presentation performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Body Summary */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-800">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl">👤</span>
                  <span>Body Language Summary</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">18/100</div>
                <div className="text-sm text-gray-600 mb-4">Overall Body Score</div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <div className="text-sm font-semibold text-emerald-700 mb-1">Strengths</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Strong eye contact (100%)</li>
                    <li>• Consistent head positioning</li>
                    <li>• Natural facial expressions</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm font-semibold text-orange-700 mb-1">Areas to Improve</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Increase hand gestures (13%)</li>
                    <li>• Improve posture positioning</li>
                    <li>• Add more dynamic movement</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">
                  Good Foundation
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Voice Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl">🎤</span>
                  <span>Voice Analysis Summary</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">75/100</div>
                <div className="text-sm text-gray-600 mb-4">Overall Voice Score</div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="text-sm font-semibold text-green-700 mb-1">Excellent Areas</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Optimal volume (63.58 dB)</li>
                    <li>• Clear pitch (237.14 Hz)</li>
                    <li>• Minimal pauses (1 total)</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm font-semibold text-orange-700 mb-1">Enhancement Areas</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Add pitch variation</li>
                    <li>• Improve modulation</li>
                    <li>• Strategic pausing</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  Strong Performance
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Summary */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-800">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl">💡</span>
                  <span>Key Suggestions</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
                <div className="text-sm text-gray-600 mb-4">Priority Actions</div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="text-sm font-semibold text-purple-700 mb-2">Immediate Actions</div>
                  <ol className="text-xs text-gray-600 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-500 font-bold">1.</span>
                      <span>Practice hand gestures during speech</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-500 font-bold">2.</span>
                      <span>Work on vocal pitch variation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-500 font-bold">3.</span>
                      <span>Add 32 more words for content depth</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-sm font-semibold text-blue-700 mb-2">Long-term Goals</div>
                  <ol className="text-xs text-gray-600 space-y-2" start={4}>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 font-bold">4.</span>
                      <span>Reduce filler words by 50%</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 font-bold">5.</span>
                      <span>Enhance flow with transitions</span>
                    </li>
                  </ol>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                  Action Plan Ready
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold text-lg">Performance Summary</span>
            </div>
            <h3 className="text-2xl font-bold">Your performance is above average!</h3>
            <p className="text-lg opacity-90">
              You need to make a good number of changes to move the needle.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">78/100</div>
                <div className="text-sm opacity-80">Your Score</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">65/100</div>
                <div className="text-sm opacity-80">Industry Average</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}