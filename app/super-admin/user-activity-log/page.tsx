'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

// Interface for user activity data
interface UserActivityData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ipAddress: string;
  loginStatus: string;
  date: string;
  department: string;
  jobTitle: string;
  status: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    users: UserActivityData[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export default function UserActivityLogPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [emailFilter, setEmailFilter] = useState('')
  const [userData, setUserData] = useState<UserActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  })

  // Fetch user activity data from API
  const fetchUserActivityData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString()
      })
      
      if (emailFilter) params.append('email', emailFilter)
      
      const response = await fetch(`/api/super-admin/user-activity-log?${params}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setUserData(data.data.users)
        setPagination(data.data.pagination)
      } else {
        setError('Failed to fetch user activity data')
        setUserData([])
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
      setError('Error fetching user activity data')
      setUserData([])
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
    fetchUserActivityData()
  }, [currentPage, rowsPerPage, emailFilter])

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchUserActivityData()
      } else {
        setCurrentPage(1) // Reset to first page when filters change
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [emailFilter])

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 7
    const totalPages = pagination.totalPages
    
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

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="user-activity-log" title="Admin Panel" />

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
          <h1 style={{
            fontSize: '28px',
            color: '#1a1a1a',
            marginBottom: '30px',
            fontWeight: '600'
          }}>User Activity Log</h1>

          {/* Filter Section */}
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <input
              type="text"
              placeholder="Filter by email address"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '12px 16px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* User Activity Log Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>First Name</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Last Name</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Email</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Phone</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>IP Address</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Login Status</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '16px'
                    }}>
                      Loading user activity data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#d32f2f',
                      fontSize: '16px'
                    }}>
                      {error}
                    </td>
                  </tr>
                ) : userData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '16px'
                    }}>
                      No user activity data found
                    </td>
                  </tr>
                ) : (
                  userData.map((record, index) => (
                    <tr key={record.id} style={{ 
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' 
                    }}>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{record.firstName}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{record.lastName}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{record.email}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{record.phone}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333',
                        fontFamily: 'monospace',
                        fontSize: '13px'
                      }}>{record.ipAddress}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{record.loginStatus}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{record.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
              {pagination.totalCount > 0 ? 
                `${((currentPage - 1) * rowsPerPage) + 1}-${Math.min(currentPage * rowsPerPage, pagination.totalCount)} of ${pagination.totalCount}` :
                '0 of 0'
              }
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
