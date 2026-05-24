'use client'

import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Sidebar from '../../../components/super-admin/Sidebar'
import { Users, Building2, User, Video, Calendar, BarChart3, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, MoreHorizontal, Loader2 } from 'lucide-react'
import { useSuperAdminDashboard } from '../../../hooks/use-super-admin-dashboard'

// Utility function to format dates
const formatDate = (dateStr: string) => {
  const [month, year] = dateStr.split(' ')
  const monthNames = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  }
  return `${monthNames[month as keyof typeof monthNames]} 20${year}`
}

// Utility function to format chart dates
const formatChartDate = (dateStr: string) => {
  const [month, year] = dateStr.split(' ')
  return `${month} '${year}`
}

// Hardcoded data for month wise video count chart
const monthWiseData = [
  { month: 'Jul 20', count: 30, formattedMonth: 'Jul \'20' },
  { month: 'Dec 20', count: 15, formattedMonth: 'Dec \'20' },
  { month: 'Aug 21', count: 25, formattedMonth: 'Aug \'21' },
  { month: 'Mar 21', count: 8, formattedMonth: 'Mar \'21' },
  { month: 'Dec 22', count: 12, formattedMonth: 'Dec \'22' },
  { month: 'Jun 22', count: 18, formattedMonth: 'Jun \'22' },
  { month: 'Feb 22', count: 5, formattedMonth: 'Feb \'22' },
  { month: 'Mar 23', count: 22, formattedMonth: 'Mar \'23' },
  { month: 'Sep 23', count: 14, formattedMonth: 'Sep \'23' },
  { month: 'Aug 23', count: 16, formattedMonth: 'Aug \'23' },
  { month: 'Sep 24', count: 20, formattedMonth: 'Sep \'24' },
  { month: 'Apr 24', count: 12, formattedMonth: 'Apr \'24' },
  { month: 'Aug 24', count: 35, formattedMonth: 'Aug \'24' },
  { month: 'Sep 25', count: 28, formattedMonth: 'Sep \'25' },
  { month: 'Jun 25', count: 45, formattedMonth: 'Jun \'25' }
]

// Hardcoded data for score wise video count chart
const scoreWiseData = [
  { score: '0', count: 45 },
  { score: '1.5', count: 38 },
  { score: '1.7', count: 42 },
  { score: '1.9', count: 35 },
  { score: '2', count: 30 },
  { score: '3', count: 8 },
  { score: '3.5', count: 12 },
  { score: '3.7', count: 18 },
  { score: '3.9', count: 22 },
  { score: '4', count: 15 },
  { score: '4.1', count: 16 },
  { score: '4.5', count: 35 },
  { score: '13.1', count: 42 },
  { score: '14.8', count: 38 },
  { score: '15.8', count: 45 },
  { score: '16.1', count: 40 },
  { score: '47.6', count: 35 }
]

// Hardcoded data for the table
const tableData = [
  { date: 'Aug 25', count: 428 },
  { date: 'Jun 25', count: 120 },
  { date: 'May 25', count: 115 },
  { date: 'Apr 25', count: 65 },
  { date: 'Jan 25', count: 9 },
  { date: 'Sep 25', count: 141 },
  { date: 'Jul 25', count: 179 },
  { date: 'Mar 25', count: 38 },
  { date: 'Feb 25', count: 74 },
  { date: 'Aug 24', count: 32 },
  { date: 'Dec 24', count: 9 },
  { date: 'Jul 24', count: 7 },
  { date: 'May 24', count: 9 },
  { date: 'Apr 24', count: 7 },
  { date: 'Mar 24', count: 23 },
  { date: 'Feb 24', count: 12 },
  { date: 'Jan 24', count: 30 },
  { date: 'Sep 24', count: 12 },
  { date: 'Nov 24', count: 2 },
  { date: 'Oct 24', count: 1 },
  { date: 'Apr 23', count: 8 },
  { date: 'Aug 23', count: 4 },
  { date: 'Nov 23', count: 14 },
  { date: 'Dec 23', count: 29 },
  { date: 'Oct 23', count: 11 },
  { date: 'Sep 23', count: 12 },
  { date: 'Jul 23', count: 8 },
  { date: 'Jun 23', count: 16 },
  { date: 'May 23', count: 7 },
  { date: 'Mar 23', count: 24 },
  { date: 'Feb 23', count: 2 },
  { date: 'Jan 23', count: 3 },
  { date: 'Jan 22', count: 4 },
  { date: 'Feb 22', count: 1 },
  { date: 'Mar 22', count: 6 },
  { date: 'Apr 22', count: 1 },
  { date: 'May 22', count: 11 },
  { date: 'Jun 22', count: 14 },
  { date: 'Sep 22', count: 20 },
  { date: 'Oct 22', count: 6 },
  { date: 'Nov 22', count: 29 },
  { date: 'Dec 22', count: 1 },
  { date: 'Aug 22', count: 3 },
  { date: 'Jun 21', count: 9 },
  { date: 'Jan 21', count: 1 },
  { date: 'Mar 21', count: 9 },
  { date: 'Apr 21', count: 28 },
  { date: 'May 21', count: 2 },
  { date: 'Jul 21', count: 30 },
  { date: 'Aug 21', count: 10 },
  { date: 'Nov 21', count: 1 },
  { date: 'Dec 21', count: 9 },
  { date: 'Jun 20', count: 10 },
  { date: 'Dec 20', count: 12 },
  { date: 'Nov 20', count: 2 },
  { date: 'Sep 20', count: 2 },
  { date: 'Aug 20', count: 1 },
  { date: 'Jul 20', count: 12 }
]

export default function SuperAdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'date' | 'count'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  // Fetch dashboard data
  const { data: dashboardData, loading, error, refetch } = useSuperAdminDashboard()

  // Filter and sort data
  const filteredData = (dashboardData?.videoTimeline || tableData).filter(row => 
    formatDate(row.date).toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.count.toString().includes(searchTerm)
  )

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortField === 'date') {
      const dateA = new Date(formatDate(a.date))
      const dateB = new Date(formatDate(b.date))
      return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    } else {
      return sortDirection === 'asc' ? a.count - b.count : b.count - a.count
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: 'date' | 'count') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }



  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="dashboard" title="Admin Panel" />

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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h1 style={{
              fontSize: '28px',
              color: '#1a1a1a',
              margin: 0,
              fontWeight: '600'
            }}>Admin Panel for back office operations</h1>
            
            <button
              onClick={refetch}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <BarChart3 size={16} />
                  Refresh Data
                </>
              )}
            </button>
          </div>

          {/* Enhanced Summary Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Active Users Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e5e9',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
            onClick={() => window.open('#/tblcustomers?filter={\'deleted_at\':null}', '_blank')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={24} color="white" />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Active Users</div>
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : error ? (
                  <span style={{ color: '#ef4444', fontSize: '14px' }}>Error loading data</span>
                ) : (
                  dashboardData?.totalUsers?.toLocaleString() || '0'
                )}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Users size={14} />
                Total registered users
              </div>
            </div>

            {/* B2B Users Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e5e9',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
            onClick={() => window.open('#/tblcustomers?filter={\'IsCompany\':\'1\'}', '_blank')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: '#10b981',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={24} color="white" />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>B2B Accounts</div>
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : error ? (
                  <span style={{ color: '#ef4444', fontSize: '14px' }}>Error loading data</span>
                ) : (
                  dashboardData?.b2bAccounts?.toLocaleString() || '0'
                )}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Building2 size={14} />
                Business accounts
              </div>
            </div>

            {/* Direct Users Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e1e5e9',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: '#f59e0b',
            borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={24} color="white" />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Direct Users</div>
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : error ? (
                  <span style={{ color: '#ef4444', fontSize: '14px' }}>Error loading data</span>
                ) : (
                  dashboardData?.directUsers?.toLocaleString() || '0'
                )}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <User size={14} />
                Individual accounts
              </div>
            </div>

            {/* Videos Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e5e9',
              borderRadius: '12px',
            padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
            onClick={() => window.open('#/tblvideos', '_blank')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: '#8b5cf6',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Video size={24} color="white" />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Total Videos</div>
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : error ? (
                  <span style={{ color: '#ef4444', fontSize: '14px' }}>Error loading data</span>
                ) : (
                  dashboardData?.totalVideos?.toLocaleString() || '0'
                )}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <BarChart3 size={14} />
                See table below for details
              </div>
            </div>
          </div>

          {/* Month Wise Video Count Chart */}
          <div style={{
            width: '100%',
            height: '350px',
            backgroundColor: '#ffffff',
            border: '1px solid #e1e5e9',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
          }}>
            <h3 style={{
                fontSize: '20px',
              color: '#1a1a1a',
                fontWeight: '600',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={20} color="#3b82f6" />
                Monthly Video Upload Trends
              </h3>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: '500'
              }}>
                Video uploads by month
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData?.videoUploadTrends || monthWiseData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="formattedMonth" 
                  stroke="#6b7280"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  domain={[0, 50]}
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                  name="Video Uploads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score Wise Video Count Chart */}
          <div style={{
            width: '100%',
            height: '350px',
            backgroundColor: '#ffffff',
            border: '1px solid #e1e5e9',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
          }}>
            <h3 style={{
                fontSize: '20px',
              color: '#1a1a1a',
                fontWeight: '600',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BarChart3 size={20} color="#10b981" />
                Score wise video count
              </h3>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: '500'
              }}>
                Dynamic from video analysis
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData?.scoreDistribution || scoreWiseData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="score" 
                  stroke="#6b7280"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  domain={[0, 50]}
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                  name="Video Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Enhanced Video Analytics Timeline */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e1e5e9',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease'
          }}>
            {/* Header Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  color: '#1a1a1a',
                  fontWeight: '600',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BarChart3 size={20} color="#8b5cf6" />
                  Video Analytics Timeline
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontWeight: '500'
                }}>
                  {(dashboardData?.videoTimeline || tableData).length} records
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
                    color: showFilters ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Filter size={14} />
                  Filters
                </button>
              </div>
            </div>

            {/* Search and Filter Section */}
            {showFilters && (
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    position: 'relative',
                    flex: '1',
                    minWidth: '200px'
                  }}>
                    <Search 
                      size={16} 
                      color="#6b7280" 
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search by date or video count..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db'
                  }}>
                    Showing {filteredData.length} of {(dashboardData?.videoTimeline || tableData).length} records
                  </div>
                </div>
              </div>
            )}
            
            {/* Enhanced Table */}
            <div style={{
              overflowX: 'auto',
            borderRadius: '8px',
              border: '1px solid #e5e7eb'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
                fontSize: '14px',
                minWidth: '500px'
            }}>
              <thead>
                  <tr style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th 
                      style={{
                    textAlign: 'left',
                        padding: '16px',
                    fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderRight: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        userSelect: 'none',
                        position: 'relative'
                      }}
                      onClick={() => handleSort('date')}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Calendar size={14} color="#6b7280" />
                        Date
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px'
                        }}>
                          <ChevronUp 
                            size={12} 
                            color={sortField === 'date' && sortDirection === 'asc' ? '#3b82f6' : '#9ca3af'} 
                          />
                          <ChevronDown 
                            size={12} 
                            color={sortField === 'date' && sortDirection === 'desc' ? '#3b82f6' : '#9ca3af'} 
                          />
                        </div>
                      </div>
                    </th>
                    <th 
                      style={{
                    textAlign: 'right',
                        padding: '16px',
                    fontWeight: '600',
                        color: '#374151',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        position: 'relative'
                      }}
                      onClick={() => handleSort('count')}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '6px'
                      }}>
                        Video Count
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px'
                        }}>
                          <ChevronUp 
                            size={12} 
                            color={sortField === 'count' && sortDirection === 'asc' ? '#3b82f6' : '#9ca3af'} 
                          />
                          <ChevronDown 
                            size={12} 
                            color={sortField === 'count' && sortDirection === 'desc' ? '#3b82f6' : '#9ca3af'} 
                          />
                        </div>
                        <Video size={14} color="#6b7280" />
                      </div>
                    </th>
                </tr>
              </thead>
              <tbody>
                  {paginatedData.map((row, index) => (
                      <tr 
                        key={startIndex + index} 
                        style={{ 
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9'
                          e.currentTarget.style.transform = 'scale(1.005)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e5e7eb',
                          color: '#374151',
                          fontWeight: '500',
                          borderRight: '1px solid #e5e7eb',
                          fontSize: '13px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Calendar size={14} color="#6b7280" />
                            <span>{formatDate(row.date)}</span>
                          </div>
                        </td>
                    <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e5e7eb',
                      textAlign: 'right',
                          color: '#1f2937',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '8px'
                          }}>
                            <span>{row.count.toLocaleString()}</span>
                            <Video size={14} color="#8b5cf6" />
                          </div>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            
            {/* Enhanced Footer with Pagination */}
            <div style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '6px'
              }}>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} records
                {searchTerm && (
                  <span style={{ marginLeft: '8px', color: '#3b82f6' }}>
                    (filtered from {(dashboardData?.videoTimeline || tableData).length} total)
                  </span>
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                      color: currentPage === 1 ? '#9ca3af' : '#374151',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          backgroundColor: currentPage === pageNum ? '#3b82f6' : 'white',
                          color: currentPage === pageNum ? 'white' : '#374151',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '32px'
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            
            {/* Summary Stats */}
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#6b7280',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span>Total: {sortedData.reduce((sum, row) => sum + row.count, 0).toLocaleString()} videos</span>
              <span>Average: {Math.round(sortedData.reduce((sum, row) => sum + row.count, 0) / sortedData.length).toLocaleString()} per period</span>
              <span>Peak: {Math.max(...sortedData.map(row => row.count)).toLocaleString()} videos</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
