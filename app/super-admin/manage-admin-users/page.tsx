'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

interface SuperAdminUser {
  id: string;
  userId: string;
  fullName: string;
  emailId: string;
  userType: string;
  openPass: string;
  contactNo: string;
  pictureLocation: string;
  status: string;
  administrator: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiResponse {
  success: boolean;
  data: {
    users: SuperAdminUser[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

export default function ManageAdminUsersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedUser, setSelectedUser] = useState<SuperAdminUser | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [adminUsers, setAdminUsers] = useState<SuperAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [exportLoading, setExportLoading] = useState(false)

  // Fetch admin users from API
  const fetchAdminUsers = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/super-admin/manage-admin-users?page=${page}&limit=${limit}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setAdminUsers(data.data.users)
        setTotalRecords(data.data.pagination.totalCount)
        setTotalPages(data.data.pagination.totalPages)
        setCurrentPage(data.data.pagination.currentPage)
      } else {
        setError(data.error || 'Failed to fetch admin users')
      }
    } catch (err) {
      setError('Failed to fetch admin users')
      console.error('Error fetching admin users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when pagination changes
  useEffect(() => {
    fetchAdminUsers(currentPage, rowsPerPage)
  }, [currentPage, rowsPerPage])

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords)

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRowsPerPage = Number(e.target.value)
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1)
    fetchAdminUsers(1, newRowsPerPage)
  }

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    // TODO: Implement sorting in API call
  }

  const handleUserClick = (user: SuperAdminUser) => {
    setSelectedUser(user)
    setShowUserDetail(true)
  }

  const handleBackToList = () => {
    setShowUserDetail(false)
    setSelectedUser(null)
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)
      
      // Fetch all admin users for export (without pagination)
      const response = await fetch('/api/super-admin/manage-admin-users?page=1&limit=10000')
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        const users = data.data.users
        
        // Create CSV content
        const headers = ['Id', 'Full Name', 'Email ID', 'User Type', 'Contact No', 'Picture Location', 'Status', 'Administrator', 'Last Login', 'Created At', 'Updated At']
        const csvContent = [
          headers.join(','),
          ...users.map(user => [
            user.id,
            `"${user.fullName}"`,
            `"${user.emailId}"`,
            `"${user.userType}"`,
            `"${user.contactNo || ''}"`,
            `"${user.pictureLocation || ''}"`,
            user.status === '1' ? 'Active' : 'Inactive',
            user.administrator ? 'Yes' : 'No',
            user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
            user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A',
            user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'
          ].join(','))
        ].join('\n')
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `admin-users-export-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert(`Successfully exported ${users.length} admin users`)
      } else {
        alert('Failed to export data: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export data')
    } finally {
      setExportLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchAdminUsers(newPage, rowsPerPage)
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="manage-admin-users" title={showUserDetail ? `Manage Admin Users #${selectedUser?.id}` : "Admin Panel"} />

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
          }}>
            {showUserDetail ? `Manage Admin Users #${selectedUser?.id}` : 'Manage Admin Users'}
          </h1>

          {/* Loading State */}
          {loading && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '16px', color: '#666' }}>Loading admin users...</div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '16px', color: '#dc3545', marginBottom: '20px' }}>Error: {error}</div>
              <button
                onClick={() => fetchAdminUsers(currentPage, rowsPerPage)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* User Detail View */}
          {showUserDetail && selectedUser && !loading ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              padding: '30px',
              position: 'relative'
            }}>
              {/* Edit Button */}
              <button
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1565c0'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976d2'
                }}
              >
                EDIT
              </button>

              {/* Back Button */}
              <button
                onClick={handleBackToList}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a6268'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#6c757d'
                }}
              >
                ← Back to List
              </button>

              {/* User Details */}
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '24px',
                border: '1px solid #e1e5e9'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Id:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.id}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Full name:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.fullName}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Email id:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.emailId}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>User type:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.userType}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Contact no:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.contactNo || '-'}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Picture location:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.pictureLocation || '-'}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Status:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.status}</span>
                </div>
                <div>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Administrator:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>
                    {selectedUser.administrator ? '⚠️' : '✅'}
                  </span>
                </div>
              </div>
            </div>
          ) : !loading && !error ? (
            /* Admin Users Table */
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}>
              {/* Export Button */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e1e5e9',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  style={{
                    backgroundColor: exportLoading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: exportLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    if (!exportLoading) {
                      e.currentTarget.style.backgroundColor = '#218838'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!exportLoading) {
                      e.currentTarget.style.backgroundColor = '#28a745'
                    }
                  }}
                >
                  {exportLoading ? '⏳' : '📥'} {exportLoading ? 'EXPORTING...' : 'EXPORT'}
                </button>
              </div>

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
                      color: '#1a1a1a',
                      width: '40px'
                    }}>
                      <input type="checkbox" style={{ marginRight: '8px' }} />
                    </th>
                    <th 
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={handleSort}
                    >
                      Id {sortOrder === 'asc' ? '↑' : '↓'}
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>Full name</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>Email id</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>User type</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>Contact no</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>Picture location</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>Status</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>Administrator</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user, index) => (
                    <tr 
                      key={`${user.id}-${index}`} 
                      onClick={() => handleUserClick(user)}
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e3f2fd'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>
                        <input type="checkbox" />
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333',
                        fontWeight: '500'
                      }}>{user.id}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{user.fullName}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{user.emailId}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{user.userType}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{user.contactNo || '-'}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{user.pictureLocation || '-'}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{user.status}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333',
                        fontSize: '16px'
                      }}>
                        {user.administrator ? '⚠️' : '✅'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Pagination - Only show when not in detail view and not loading */}
          {!showUserDetail && !loading && !error && (
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
                {startIndex + 1}-{endIndex} of {totalRecords}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                    color: currentPage === 1 ? '#ccc' : '#333',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  &lt;
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                    color: currentPage === totalPages ? '#ccc' : '#333',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
