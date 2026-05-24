'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import Sidebar from '../../../components/super-admin/Sidebar'

// Interface for video data
interface VideoData {
  id: string;
  _id: string;
  userName: string;
  emailId: string;
  contactNumber: string;
  videoType: string;
  videoName: string;
  overallScore: number;
  bodyLangScore: number;
  wordPowerScore: number;
  vocalToneScore: number;
  processingStatus: string;
  uploadDate: string;
  lastUpdateDate: string;
  duration: number;
  fileSize: number;
  language: string;
  confidenceScore: number;
  engagementScore: number;
  anxietyScore: number;
  positiveEmotion: number;
  negativeEmotion: number;
  textSentiment: string;
  speechRate: number;
  averageVolume: number;
  modulation: number;
  wordCount: number;
  keywords: string;
  summary: string;
  originalTranscript: string;
  correctedTranscript: string;
  eyeContact: number;
  smile: number;
  hands: number;
  headMovement: number;
  questionOne: string;
  questionTwo: string;
  questionThree: string;
  questionFive: string;
  questionSix: string;
  questionSeven: string;
  jobRole: string;
  whatKind: string;
  video: string;
  legsBalanced: number;
  handCrossed: number;
  wristClosed: number;
  legsMovement: number;
  weightOneLeg: number;
  textEmotions: string;
  dataUsed: string;
  uniqueWords: number;
  sentLen: number;
  lused: number;
  petWords: string;
  fillers: number;
  type: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    videos: VideoData[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    videoUploadTrends: any[];
  };
}



export default function VideosPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  
  // Dynamic data state
  const [videoData, setVideoData] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50,
    hasNext: false,
    hasPrev: false
  })
  const [emailFilter, setEmailFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')

  // Fetch videos from API
  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString()
      })
      
      if (emailFilter) params.append('email', emailFilter)
      if (phoneFilter) params.append('phone', phoneFilter)
      
      const response = await fetch(`/api/super-admin/videos?${params}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setVideoData(data.data.videos)
        setPagination(data.data.pagination)
      } else {
        setError('Failed to fetch videos')
        setVideoData([])
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: rowsPerPage,
          hasNext: false,
          hasPrev: false
        })
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError('Failed to fetch videos')
      setVideoData([])
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        limit: rowsPerPage,
        hasNext: false,
        hasPrev: false
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchVideos()
  }, [currentPage, rowsPerPage, emailFilter, phoneFilter])

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchVideos()
      } else {
        setCurrentPage(1) // Reset to first page when filters change
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [emailFilter, phoneFilter])

  const totalVideos = pagination.totalCount
  const totalPages = pagination.totalPages

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    userName: true,
    emailId: true,
    contactNumber: true,
    videoType: true,
    videoName: true,
    overallScore: true,
    bodyLangScore: true,
    wordPowerScore: true,
    vocalToneScore: true,
    processingStatus: true,
    uploadDate: true,
    lastUpdateDate: true,
    // Additional columns that can be toggled - making key ones visible by default
    questionOne: true,
    questionTwo: true,
    questionThree: true,
    questionFive: true,
    questionSix: true,
    questionSeven: true,
    jobRole: true,
    whatKind: true,
    confidenceScore: true,
    engagementScore: true,
    anxietyScore: true,
    video: false,
    positiveEmotion: true,
    eyeContact: true,
    smile: true,
    hands: true,
    legsBalanced: true,
    handCrossed: true,
    wristClosed: true,
    legsMovement: true,
    weightOneLeg: true,
    headMovement: true,
    negativeEmotion: true,
    speechRate: true,
    duration: true,
    averageVolume: true,
    modulation: true,
    textSentiment: true,
    textEmotions: true,
    dataUsed: true,
    uniqueWords: true,
    sentLen: true,
    lused: true,
    keywords: true,
    petWords: true,
    fillers: true,
    type: true
  })

  // Common styles for table headers
  const headerStyle = {
    textAlign: 'left' as const,
    padding: '16px',
    borderBottom: '1px solid #e1e5e9',
    fontWeight: '600',
    color: '#1a1a1a',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    minWidth: '120px',
    whiteSpace: 'nowrap' as const
  }

  const getHeaderStyle = (columnKey: string) => ({
    ...headerStyle,
    backgroundColor: selectedColumn === columnKey ? '#e3f2fd' : 'transparent'
  })

  const getCellStyle = () => ({
    padding: '16px',
    borderBottom: '1px solid #e1e5e9',
    fontSize: '14px',
    color: '#333',
    minWidth: '120px',
    whiteSpace: 'nowrap' as const
  })

  const toggleColumn = (columnKey: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }

  // Generate chart data based on selected column from actual video data
  const generateChartData = (columnKey: string) => {
    if (!videoData || videoData.length === 0) {
      return []
    }

    // Count occurrences of each value in the selected column
    const valueCounts: { [key: string]: number } = {}
    
    videoData.forEach(video => {
      const value = (video as any)[columnKey]
      if (value !== null && value !== undefined && value !== '') {
        const stringValue = String(value)
        valueCounts[stringValue] = (valueCounts[stringValue] || 0) + 1
      }
    })

    // Convert to chart data format
    return Object.entries(valueCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Sort by count descending
  }

  const handleColumnClick = (columnKey: string) => {
    setSelectedColumn(columnKey)
    const data = generateChartData(columnKey)
    setChartData(data)
    
    // Determine chart type based on data
    if (data.length <= 5) {
      setChartType('pie')
    } else if (data.length > 10) {
      setChartType('line')
    } else {
      setChartType('bar')
    }
  }

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalVideos)

  // Use the data directly from API (already filtered and paginated)
  const currentVideos = videoData


  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 7
    
    if (currentPage <= 3) {
      // Show first pages
      for (let i = 1; i <= Math.min(5, totalPages); i++) {
        pageNumbers.push(i)
      }
      if (totalPages > 5) {
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last pages
      pageNumbers.push(1)
      if (totalPages > 5) {
        pageNumbers.push('...')
      }
      for (let i = Math.max(totalPages - 4, 1); i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Show middle pages
      pageNumbers.push(1)
      pageNumbers.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i)
      }
      pageNumbers.push('...')
      pageNumbers.push(totalPages)
    }
    
    return pageNumbers.map((number, index) => (
      <button
        key={index}
        onClick={() => typeof number === 'number' && setCurrentPage(number)}
        style={{
          padding: '8px 12px',
          margin: '0 2px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: number === currentPage ? '#1976d2' : '#ffffff',
          color: number === currentPage ? 'white' : '#333',
          cursor: typeof number === 'number' ? 'pointer' : 'default',
          fontSize: '14px',
          minWidth: '36px',
          textAlign: 'center',
        }}
        disabled={typeof number !== 'number'}
      >
        {number}
      </button>
    ))
  }

  const formatValue = (value: any) => {
    return value !== null ? value : '-'
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="videos" title="Admin Panel" />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        backgroundColor: '#f8f9fa',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{
          padding: '40px 20px',
          maxWidth: '100%'
        }}>
          {/* Page Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontSize: '28px',
              color: '#1a1a1a',
              fontWeight: '600',
              margin: 0
            }}>Videos</h1>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={() => setShowColumnModal(true)}
                style={{
                backgroundColor: 'transparent',
                color: '#666',
                border: '1px solid #e1e5e9',
                padding: '10px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                COLUMNS ☰
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '8px'
              }}>Filter by Email Address</label>
              <input
                type="email"
                placeholder="Enter email address..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '8px'
              }}>Filter by Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number..."
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            </div>
            
          {/* Column Visibility Modal */}
          {showColumnModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>Column Visibility</h3>
                  <button
                    onClick={() => setShowColumnModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    ×
                  </button>
            </div>
            
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Core Columns */}
                  {Object.entries(columnVisibility).map(([key, isVisible]) => {
                    const columnLabels: { [key: string]: string } = {
                      userName: 'User Name',
                      emailId: 'Email ID',
                      contactNumber: 'Contact Number',
                      videoType: 'Video Type',
                      videoName: 'Video Name',
                      overallScore: 'Over All Score',
                      bodyLangScore: 'Body Lang Score',
                      wordPowerScore: 'Word Power Score',
                      vocalToneScore: 'Vocal Tone Score',
                      processingStatus: 'Processing Status',
                      uploadDate: 'Upload Date',
                      lastUpdateDate: 'Last Update Date',
                      questionOne: 'Question One',
                      questionTwo: 'Question Two',
                      questionThree: 'Question Three',
                      questionFive: 'Question Five',
                      questionSix: 'Question Six',
                      questionSeven: 'Question Seven',
                      jobRole: 'Job Role',
                      whatKind: 'What kind',
                      confidenceScore: 'Confidence Score',
                      engagementScore: 'Engagement Score',
                      anxietyScore: 'Anxiety Score',
                      video: 'Video',
                      positiveEmotion: 'Positive emotion',
                      eyeContact: 'Eye contact',
                      smile: 'Smile',
                      hands: 'Hands',
                      legsBalanced: 'Legs balanced',
                      handCrossed: 'Hand crossed',
                      wristClosed: 'Wrist closed',
                      legsMovement: 'Legs movement',
                      weightOneLeg: 'Weight one leg',
                      headMovement: 'Head movement',
                      negativeEmotion: 'Negative emotion',
                      speechRate: 'Speech rate',
                      duration: 'Duration',
                      averageVolume: 'Average volume',
                      modulation: 'Modulation',
                      textSentiment: 'Text sentiment',
                      textEmotions: 'Text emotions',
                      dataUsed: 'Data used',
                      uniqueWords: 'Unique words',
                      sentLen: 'Sent len',
                      lused: 'lused',
                      keywords: 'Keywords',
                      petWords: 'Pet words',
                      fillers: 'Fillers',
                      type: 'Type'
                    }
                    
                    return (
                      <div key={key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #4a5568'
                      }}>
                        <span style={{
                          color: 'white',
                fontSize: '14px',
                          flex: 1
                        }}>
                          {columnLabels[key] || key}
                        </span>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div
                            onClick={() => toggleColumn(key as keyof typeof columnVisibility)}
                            style={{
                              width: '40px',
                              height: '20px',
                              backgroundColor: isVisible ? '#3b82f6' : '#6b7280',
                              borderRadius: '10px',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                          >
                            <div style={{
                              width: '16px',
                              height: '16px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              position: 'absolute',
                              top: '2px',
                              left: isVisible ? '22px' : '2px',
                              transition: 'left 0.2s ease',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }} />
            </div>
            
                          <div style={{
                            color: '#9ca3af',
                            cursor: 'grab',
                            fontSize: '16px'
                          }}>
                            ⋮⋮
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => setShowColumnModal(false)}
                style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: 'white',
                      border: '1px solid #4a5568',
                  borderRadius: '4px',
                      cursor: 'pointer',
                  fontSize: '14px'
                }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowColumnModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Apply
                  </button>
            </div>
          </div>
            </div>
          )}

          {/* Videos Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            overflowX: 'auto',
            overflowY: 'hidden',
            position: 'relative'
          }}>
            {/* Scroll indicator */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              color: '#666',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              ← Scroll horizontally to see more columns →
            </div>
            <table style={{
              width: '100%',
              minWidth: '2000px', // Ensure table has minimum width for many columns
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  {columnVisibility.userName && (
                    <th 
                      onClick={() => handleColumnClick('userName')}
                      style={getHeaderStyle('userName')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'userName') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'userName') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >User Name</th>
                  )}
                  {columnVisibility.emailId && (
                    <th 
                      onClick={() => handleColumnClick('emailId')}
                      style={getHeaderStyle('emailId')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'emailId') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'emailId') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Email ID</th>
                  )}
                  {columnVisibility.contactNumber && (
                    <th 
                      onClick={() => handleColumnClick('contactNumber')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'contactNumber' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'contactNumber') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'contactNumber') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Contact Number</th>
                  )}
                  {columnVisibility.videoType && (
                    <th 
                      onClick={() => handleColumnClick('videoType')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'videoType' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'videoType') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'videoType') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Video Type</th>
                  )}
                  {columnVisibility.videoName && (
                    <th 
                      onClick={() => handleColumnClick('videoName')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'videoName' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'videoName') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'videoName') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Video Name</th>
                  )}
                  {columnVisibility.overallScore && (
                    <th 
                      onClick={() => handleColumnClick('overallScore')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'overallScore' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'overallScore') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'overallScore') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Overall Score</th>
                  )}
                  {columnVisibility.bodyLangScore && (
                    <th 
                      onClick={() => handleColumnClick('bodyLangScore')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'bodyLangScore' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'bodyLangScore') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'bodyLangScore') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Body Lang Score</th>
                  )}
                  {columnVisibility.wordPowerScore && (
                    <th 
                      onClick={() => handleColumnClick('wordPowerScore')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'wordPowerScore' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'wordPowerScore') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'wordPowerScore') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Word Power Score</th>
                  )}
                  {columnVisibility.vocalToneScore && (
                    <th 
                      onClick={() => handleColumnClick('vocalToneScore')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'vocalToneScore' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'vocalToneScore') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'vocalToneScore') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Vocal Tone Score</th>
                  )}
                  {columnVisibility.processingStatus && (
                    <th 
                      onClick={() => handleColumnClick('processingStatus')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'processingStatus' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'processingStatus') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'processingStatus') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Processing Status</th>
                  )}
                  {columnVisibility.uploadDate && (
                    <th 
                      onClick={() => handleColumnClick('uploadDate')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'uploadDate' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'uploadDate') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'uploadDate') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Upload Date</th>
                  )}
                  {columnVisibility.lastUpdateDate && (
                    <th 
                      onClick={() => handleColumnClick('lastUpdateDate')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'lastUpdateDate' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'lastUpdateDate') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'lastUpdateDate') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Last Update Date</th>
                  )}
                  
                  {/* Additional Columns from Modal */}
                  {columnVisibility.questionOne && (
                    <th 
                      onClick={() => handleColumnClick('questionOne')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'questionOne' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'questionOne') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'questionOne') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Question One</th>
                  )}
                  {columnVisibility.questionTwo && (
                    <th 
                      onClick={() => handleColumnClick('questionTwo')}
                      style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'questionTwo' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'questionTwo') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'questionTwo') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Question Two</th>
                  )}
                  {columnVisibility.questionThree && (
                    <th 
                      onClick={() => handleColumnClick('questionThree')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'questionThree' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'questionThree') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'questionThree') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Question Three</th>
                  )}
                  {columnVisibility.questionFive && (
                    <th 
                      onClick={() => handleColumnClick('questionFive')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'questionFive' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'questionFive') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'questionFive') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Question Five</th>
                  )}
                  {columnVisibility.questionSix && (
                    <th 
                      onClick={() => handleColumnClick('questionSix')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'questionSix' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'questionSix') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'questionSix') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Question Six</th>
                  )}
                  {columnVisibility.questionSeven && (
                    <th 
                      onClick={() => handleColumnClick('questionSeven')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'questionSeven' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'questionSeven') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'questionSeven') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Question Seven</th>
                  )}
                  {columnVisibility.jobRole && (
                    <th 
                      onClick={() => handleColumnClick('jobRole')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'jobRole' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'jobRole') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'jobRole') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Job Role</th>
                  )}
                  {columnVisibility.whatKind && (
                    <th 
                      onClick={() => handleColumnClick('whatKind')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'whatKind' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'whatKind') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'whatKind') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >What kind</th>
                  )}
                  {columnVisibility.confidenceScore && (
                    <th 
                      onClick={() => handleColumnClick('confidenceScore')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'confidenceScore' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'confidenceScore') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'confidenceScore') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Confidence Score</th>
                  )}
                  {columnVisibility.engagementScore && (
                    <th 
                      onClick={() => handleColumnClick('engagementScore')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'engagementScore' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'engagementScore') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'engagementScore') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Engagement Score</th>
                  )}
                  {columnVisibility.anxietyScore && (
                    <th 
                      onClick={() => handleColumnClick('anxietyScore')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'anxietyScore' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'anxietyScore') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'anxietyScore') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Anxiety Score</th>
                  )}
                  {columnVisibility.video && (
                    <th 
                      onClick={() => handleColumnClick('video')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'video' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'video') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'video') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Video</th>
                  )}
                  {columnVisibility.positiveEmotion && (
                    <th 
                      onClick={() => handleColumnClick('positiveEmotion')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'positiveEmotion' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'positiveEmotion') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'positiveEmotion') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Positive emotion</th>
                  )}
                  {columnVisibility.eyeContact && (
                    <th 
                      onClick={() => handleColumnClick('eyeContact')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'eyeContact' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'eyeContact') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'eyeContact') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Eye contact</th>
                  )}
                  {columnVisibility.smile && (
                    <th 
                      onClick={() => handleColumnClick('smile')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'smile' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'smile') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'smile') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Smile</th>
                  )}
                  {columnVisibility.hands && (
                    <th 
                      onClick={() => handleColumnClick('hands')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'hands' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'hands') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'hands') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Hands</th>
                  )}
                  {columnVisibility.legsBalanced && (
                    <th 
                      onClick={() => handleColumnClick('legsBalanced')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'legsBalanced' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'legsBalanced') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'legsBalanced') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Legs balanced</th>
                  )}
                  {columnVisibility.handCrossed && (
                    <th 
                      onClick={() => handleColumnClick('handCrossed')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'handCrossed' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'handCrossed') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'handCrossed') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Hand crossed</th>
                  )}
                  {columnVisibility.wristClosed && (
                    <th 
                      onClick={() => handleColumnClick('wristClosed')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'wristClosed' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'wristClosed') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'wristClosed') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Wrist closed</th>
                  )}
                  {columnVisibility.legsMovement && (
                    <th 
                      onClick={() => handleColumnClick('legsMovement')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'legsMovement' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'legsMovement') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'legsMovement') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Legs movement</th>
                  )}
                  {columnVisibility.weightOneLeg && (
                    <th 
                      onClick={() => handleColumnClick('weightOneLeg')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'weightOneLeg' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'weightOneLeg') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'weightOneLeg') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Weight one leg</th>
                  )}
                  {columnVisibility.headMovement && (
                    <th 
                      onClick={() => handleColumnClick('headMovement')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'headMovement' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'headMovement') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'headMovement') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Head movement</th>
                  )}
                  {columnVisibility.negativeEmotion && (
                    <th 
                      onClick={() => handleColumnClick('negativeEmotion')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'negativeEmotion' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'negativeEmotion') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'negativeEmotion') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Negative emotion</th>
                  )}
                  {columnVisibility.speechRate && (
                    <th 
                      onClick={() => handleColumnClick('speechRate')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'speechRate' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'speechRate') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'speechRate') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Speech rate</th>
                  )}
                  {columnVisibility.duration && (
                    <th 
                      onClick={() => handleColumnClick('duration')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'duration' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'duration') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'duration') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Duration</th>
                  )}
                  {columnVisibility.averageVolume && (
                    <th 
                      onClick={() => handleColumnClick('averageVolume')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'averageVolume' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'averageVolume') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'averageVolume') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Average volume</th>
                  )}
                  {columnVisibility.modulation && (
                    <th 
                      onClick={() => handleColumnClick('modulation')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'modulation' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'modulation') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'modulation') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Modulation</th>
                  )}
                  {columnVisibility.textSentiment && (
                    <th 
                      onClick={() => handleColumnClick('textSentiment')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'textSentiment' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'textSentiment') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'textSentiment') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Text sentiment</th>
                  )}
                  {columnVisibility.textEmotions && (
                    <th 
                      onClick={() => handleColumnClick('textEmotions')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'textEmotions' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'textEmotions') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'textEmotions') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Text emotions</th>
                  )}
                  {columnVisibility.dataUsed && (
                    <th 
                      onClick={() => handleColumnClick('dataUsed')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'dataUsed' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'dataUsed') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'dataUsed') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Data used</th>
                  )}
                  {columnVisibility.uniqueWords && (
                    <th 
                      onClick={() => handleColumnClick('uniqueWords')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'uniqueWords' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'uniqueWords') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'uniqueWords') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Unique words</th>
                  )}
                  {columnVisibility.sentLen && (
                    <th 
                      onClick={() => handleColumnClick('sentLen')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'sentLen' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'sentLen') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'sentLen') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Sent len</th>
                  )}
                  {columnVisibility.lused && (
                    <th 
                      onClick={() => handleColumnClick('lused')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'lused' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'lused') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'lused') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >lused</th>
                  )}
                  {columnVisibility.keywords && (
                    <th 
                      onClick={() => handleColumnClick('keywords')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'keywords' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'keywords') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'keywords') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Keywords</th>
                  )}
                  {columnVisibility.petWords && (
                    <th 
                      onClick={() => handleColumnClick('petWords')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'petWords' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'petWords') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'petWords') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Pet words</th>
                  )}
                  {columnVisibility.fillers && (
                    <th 
                      onClick={() => handleColumnClick('fillers')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'fillers' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'fillers') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'fillers') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Fillers</th>
                  )}
                  {columnVisibility.type && (
                    <th 
                      onClick={() => handleColumnClick('type')}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        backgroundColor: selectedColumn === 'type' ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'type') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'type') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Type</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={Object.keys(columnVisibility).filter(key => columnVisibility[key as keyof typeof columnVisibility]).length} style={{ textAlign: 'center', padding: '40px' }}>
                      Loading videos...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={Object.keys(columnVisibility).filter(key => columnVisibility[key as keyof typeof columnVisibility]).length} style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                      Error: {error}
                    </td>
                  </tr>
                ) : currentVideos.length === 0 ? (
                  <tr>
                    <td colSpan={Object.keys(columnVisibility).filter(key => columnVisibility[key as keyof typeof columnVisibility]).length} style={{ textAlign: 'center', padding: '40px' }}>
                      No videos found
                    </td>
                  </tr>
                ) : (
                  currentVideos.map((video, index) => (
                  <tr key={index} style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' 
                  }}>
                    {columnVisibility.userName && (
                      <td style={getCellStyle()}>{video.userName}</td>
                    )}
                    {columnVisibility.emailId && (
                    <td style={getCellStyle()}>{video.emailId}</td>
                    )}
                    {columnVisibility.contactNumber && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                      }}>{video.contactNumber}</td>
                    )}
                    {columnVisibility.videoType && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{video.videoType}</td>
                    )}
                    {columnVisibility.videoName && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                      }}>{video.videoName}</td>
                    )}
                    {columnVisibility.overallScore && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{formatValue(video.overallScore)}</td>
                    )}
                    {columnVisibility.bodyLangScore && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{formatValue(video.bodyLangScore)}</td>
                    )}
                    {columnVisibility.wordPowerScore && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{formatValue(video.wordPowerScore)}</td>
                    )}
                    {columnVisibility.vocalToneScore && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{formatValue(video.vocalToneScore)}</td>
                    )}
                    {columnVisibility.processingStatus && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{formatValue(video.processingStatus)}</td>
                    )}
                    {columnVisibility.uploadDate && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{video.uploadDate}</td>
                    )}
                    {columnVisibility.lastUpdateDate && (
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{video.lastUpdateDate}</td>
                    )}
                    
                    {/* Additional Column Cells */}
                    {columnVisibility.questionOne && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.questionOne}</td>
                    )}
                    {columnVisibility.questionTwo && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.questionTwo}</td>
                    )}
                    {columnVisibility.questionThree && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.questionThree}</td>
                    )}
                    {columnVisibility.questionFive && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.questionFive}</td>
                    )}
                    {columnVisibility.questionSix && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.questionSix}</td>
                    )}
                    {columnVisibility.questionSeven && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.questionSeven}</td>
                    )}
                    {columnVisibility.jobRole && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.jobRole}</td>
                    )}
                    {columnVisibility.whatKind && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.whatKind}</td>
                    )}
                    {columnVisibility.confidenceScore && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.confidenceScore}</td>
                    )}
                    {columnVisibility.engagementScore && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.engagementScore}</td>
                    )}
                    {columnVisibility.anxietyScore && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.anxietyScore}</td>
                    )}
                    {columnVisibility.video && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.video}</td>
                    )}
                    {columnVisibility.positiveEmotion && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.positiveEmotion}</td>
                    )}
                    {columnVisibility.eyeContact && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.eyeContact}</td>
                    )}
                    {columnVisibility.smile && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.smile}</td>
                    )}
                    {columnVisibility.hands && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.hands}</td>
                    )}
                    {columnVisibility.legsBalanced && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.legsBalanced}</td>
                    )}
                    {columnVisibility.handCrossed && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.handCrossed}</td>
                    )}
                    {columnVisibility.wristClosed && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.wristClosed}</td>
                    )}
                    {columnVisibility.legsMovement && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.legsMovement}</td>
                    )}
                    {columnVisibility.weightOneLeg && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.weightOneLeg}</td>
                    )}
                    {columnVisibility.headMovement && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.headMovement}</td>
                    )}
                    {columnVisibility.negativeEmotion && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.negativeEmotion}</td>
                    )}
                    {columnVisibility.speechRate && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.speechRate}</td>
                    )}
                    {columnVisibility.duration && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.duration}</td>
                    )}
                    {columnVisibility.averageVolume && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.averageVolume}</td>
                    )}
                    {columnVisibility.modulation && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.modulation}</td>
                    )}
                    {columnVisibility.textSentiment && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.textSentiment}</td>
                    )}
                    {columnVisibility.textEmotions && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.textEmotions}</td>
                    )}
                    {columnVisibility.dataUsed && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.dataUsed}</td>
                    )}
                    {columnVisibility.uniqueWords && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.uniqueWords}</td>
                    )}
                    {columnVisibility.sentLen && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.sentLen}</td>
                    )}
                    {columnVisibility.lused && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.lused}</td>
                    )}
                    {columnVisibility.keywords && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.keywords}</td>
                    )}
                    {columnVisibility.petWords && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.petWords}</td>
                    )}
                    {columnVisibility.fillers && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.fillers}</td>
                    )}
                    {columnVisibility.type && (
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontSize: '14px',
                        color: '#333'
                      }}>{video.type}</td>
                    )}
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Dynamic Chart Section */}
          {selectedColumn && chartData.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '30px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  color: '#1a1a1a',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {selectedColumn === 'userName' ? 'User Name' :
                   selectedColumn === 'emailId' ? 'Email ID' :
                   selectedColumn === 'overallScore' ? 'Overall Score Distribution' :
                   selectedColumn === 'bodyLangScore' ? 'Body Language Score Distribution' :
                   selectedColumn === 'wordPowerScore' ? 'Word Power Score Distribution' :
                   selectedColumn === 'vocalToneScore' ? 'Vocal Tone Score Distribution' :
                   selectedColumn === 'processingStatus' ? 'Processing Status' :
                   selectedColumn === 'uploadDate' ? 'Upload Date Distribution' :
                   selectedColumn === 'questionOne' ? 'Question One Responses' :
                   selectedColumn === 'questionTwo' ? 'Question Two Responses' :
                   selectedColumn === 'questionThree' ? 'Question Three Responses' :
                   selectedColumn === 'jobRole' ? 'Job Role Distribution' :
                   selectedColumn === 'whatKind' ? 'Video Type Distribution' :
                   selectedColumn === 'confidenceScore' ? 'Confidence Score Distribution' :
                   selectedColumn === 'engagementScore' ? 'Engagement Score Distribution' :
                   selectedColumn === 'anxietyScore' ? 'Anxiety Score Distribution' :
                   selectedColumn === 'positiveEmotion' ? 'Positive Emotion Analysis' :
                   selectedColumn === 'eyeContact' ? 'Eye Contact Analysis' :
                   selectedColumn === 'smile' ? 'Smile Frequency Analysis' :
                   selectedColumn === 'hands' ? 'Hand Gesture Analysis' :
                   selectedColumn === 'legsBalanced' ? 'Legs Balanced Analysis' :
                   selectedColumn === 'handCrossed' ? 'Hand Crossed Analysis' :
                   selectedColumn === 'wristClosed' ? 'Wrist Closed Analysis' :
                   selectedColumn === 'legsMovement' ? 'Legs Movement Analysis' :
                   selectedColumn === 'weightOneLeg' ? 'Weight One Leg Analysis' :
                   selectedColumn === 'headMovement' ? 'Head Movement Analysis' :
                   selectedColumn === 'negativeEmotion' ? 'Negative Emotion Analysis' :
                   selectedColumn === 'speechRate' ? 'Speech Rate Analysis' :
                   selectedColumn === 'duration' ? 'Duration Analysis' :
                   selectedColumn === 'averageVolume' ? 'Average Volume Analysis' :
                   selectedColumn === 'modulation' ? 'Modulation Analysis' :
                   selectedColumn === 'textSentiment' ? 'Text Sentiment Analysis' :
                   selectedColumn === 'textEmotions' ? 'Text Emotions Analysis' :
                   selectedColumn === 'dataUsed' ? 'Data Usage Analysis' :
                   selectedColumn === 'uniqueWords' ? 'Unique Words Analysis' :
                   selectedColumn === 'keywords' ? 'Keywords Analysis' :
                   selectedColumn === 'petWords' ? 'Pet Words Analysis' :
                   selectedColumn === 'fillers' ? 'Fillers Analysis' :
                   selectedColumn === 'type' ? 'Type Distribution' :
                   'Column Analysis'} Chart
                </h3>
                
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setChartType('bar')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: chartType === 'bar' ? '#3b82f6' : '#f3f4f6',
                      color: chartType === 'bar' ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: chartType === 'pie' ? '#3b82f6' : '#f3f4f6',
                      color: chartType === 'pie' ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Pie
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: chartType === 'line' ? '#3b82f6' : '#f3f4f6',
                      color: chartType === 'line' ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Line
                  </button>
                </div>
              </div>
              
              <div style={{
                height: '400px',
                width: '100%'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#374151', fontWeight: '600' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / chartData.length}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#374151', fontWeight: '600' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <strong>Data Summary:</strong> {chartData.length} unique values found in {selectedColumn} column
              </div>
            </div>
          )}

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Rows per page: 
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: !pagination.hasPrev ? '#f5f5f5' : '#ffffff',
                  color: !pagination.hasPrev ? '#ccc' : '#333',
                  cursor: !pagination.hasPrev ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                &lt;
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNext}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: !pagination.hasNext ? '#f5f5f5' : '#ffffff',
                  color: !pagination.hasNext ? '#ccc' : '#333',
                  cursor: !pagination.hasNext ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
