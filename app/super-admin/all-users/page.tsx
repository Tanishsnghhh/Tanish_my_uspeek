'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  phone: string;
  isActive: boolean;
  status: string;
  role: string;
  companyName: string;
  accountId: string;
  department: string;
  jobTitle: string;
  employeeId: string;
  location: string;
  country: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  success: boolean;
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    activeUsers: number;
    inactiveUsers: number;
  };
}

export default function AllUsersPage() {
  const [emailFilter, setEmailFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [usersData, setUsersData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [stats, setStats] = useState({
    total: 0,
    byRole: {},
    byStatus: {},
    activeUsers: 0,
    inactiveUsers: 0
  })

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [showColumnsModal, setShowColumnsModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)

  // Add user form state
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    city: '',
    state: '',
    country: '',
    countryCode: '',
    phoneCode: '',
    location: ''
  })

  // Bulk upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Column configuration state
  const [columnConfig, setColumnConfig] = useState([
    { key: 'edit', label: 'EDIT', visible: true, order: 0 },
    { key: 'id', label: 'ID', visible: true, order: 1 },
    { key: 'email', label: 'Email Address', visible: true, order: 2 },
    { key: 'firstName', label: 'First Name', visible: true, order: 3 },
    { key: 'lastName', label: 'Last Name', visible: true, order: 4 },
    { key: 'userName', label: 'User Name', visible: true, order: 5 },
    { key: 'phone', label: 'Phone', visible: true, order: 6 },
    { key: 'role', label: 'Role', visible: true, order: 7 },
    { key: 'status', label: 'Status', visible: true, order: 8 },
    { key: 'companyName', label: 'Company Name', visible: false, order: 9 },
    { key: 'accountId', label: 'Account ID', visible: false, order: 10 },
    { key: 'department', label: 'Department', visible: false, order: 11 },
    { key: 'jobTitle', label: 'Job Title', visible: false, order: 12 },
    { key: 'employeeId', label: 'Employee ID', visible: false, order: 13 },
    { key: 'location', label: 'Location', visible: false, order: 14 },
    { key: 'country', label: 'Country', visible: false, order: 15 },
    { key: 'lastLoginAt', label: 'Last Login', visible: false, order: 16 },
    { key: 'createdAt', label: 'Created At', visible: false, order: 17 },
    { key: 'updatedAt', label: 'Updated At', visible: false, order: 18 }
  ])

  // Fetch users data from API
  useEffect(() => {
    fetchUsers()
  }, [currentPage, rowsPerPage, emailFilter, phoneFilter, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString(),
      })
      
      if (emailFilter) params.append('email', emailFilter)
      if (phoneFilter) params.append('phone', phoneFilter)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/super-admin/all-users?${params}`)
      const data: UsersResponse = await response.json()
      
      if (data.success) {
        setUsersData(data.users)
        setPagination(data.pagination)
        setStats(data.stats)
      } else {
        setError('Failed to fetch users data')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Error loading users data')
    } finally {
      setLoading(false)
    }
  }

  const totalRecords = pagination.totalRecords
  const totalPages = pagination.totalPages
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + usersData.length, totalRecords)
  const currentUsers = usersData

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleUserClick = (user: any) => {
    setSelectedUser(user)
    setShowUserDetail(true)
  }

  const handleBackToList = () => {
    setShowUserDetail(false)
    setSelectedUser(null)
  }

  // Handle adding new user
  const handleAddUser = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate required fields
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.city || !newUser.state || !newUser.country || !newUser.countryCode || !newUser.phoneCode || !newUser.location) {
        alert('Please fill in all required fields (First Name, Last Name, Email, City, State, Country, Country Code, Phone Code, Location)')
        return
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        alert('Please enter a valid email address')
        return
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone || null,
          role: newUser.role,
          city: newUser.city,
          state: newUser.state,
          country: newUser.country,
          countryCode: newUser.countryCode,
          phoneCode: newUser.phoneCode,
          location: newUser.location
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Show temporary password
        const tempPassword = data.data.tempPassword
        alert(`User created successfully!\n\nTemporary Password: ${tempPassword}\n\nPlease share this password with the user securely.`)
        
        // Reset form
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'EMPLOYEE',
          city: '',
          state: '',
          country: '',
          countryCode: '',
          phoneCode: '',
          location: ''
        })
        
        // Close modal and refresh data
        setShowAddUserModal(false)
        fetchUsers()
      } else {
        alert(`Error creating user: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file')
      return
    }

    try {
      setIsUploading(true)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/super-admin/b2b-admin-users/bulk-upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUploadResults(data.data)
        alert(`Bulk upload completed!\n\nSuccessfully created: ${data.data.successCount} users\nErrors: ${data.data.errorCount}`)
        
        // Reset file selection and refresh data
        setSelectedFile(null)
        setShowBulkUploadModal(false)
        fetchUsers()
      } else {
        alert(`Bulk upload failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error during bulk upload:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle column toggle
  const toggleColumn = (key: string) => {
    setColumnConfig(prev => prev.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ))
  }

  // Handle column reorder
  const reorderColumns = (fromIndex: number, toIndex: number) => {
    const newConfig = [...columnConfig]
    const [movedItem] = newConfig.splice(fromIndex, 1)
    newConfig.splice(toIndex, 0, movedItem)
    
    // Update order values
    const updatedConfig = newConfig.map((col, index) => ({
      ...col,
      order: index
    }))
    
    setColumnConfig(updatedConfig)
  }

  // Get visible columns sorted by order
  const getVisibleColumns = () => {
    return columnConfig
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
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

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="all-users" title={showUserDetail ? `All users #${selectedUser?.id}` : "All users"} />

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
            {showUserDetail ? `All users #${selectedUser?.id}` : 'All users'}
          </h1>

          {/* Stats Section - Only show when not in detail view */}
          {!showUserDetail && !loading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e1e5e9',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Users</div>
                <div style={{ fontSize: '28px', color: '#1976d2', fontWeight: '600' }}>{stats.total}</div>
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e1e5e9',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Active Users</div>
                <div style={{ fontSize: '28px', color: '#4caf50', fontWeight: '600' }}>{stats.activeUsers}</div>
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e1e5e9',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Inactive Users</div>
                <div style={{ fontSize: '28px', color: '#f44336', fontWeight: '600' }}>{stats.inactiveUsers}</div>
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e1e5e9',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Employees</div>
                <div style={{ fontSize: '28px', color: '#9c27b0', fontWeight: '600' }}>{(stats.byRole as any).EMPLOYEE || 0}</div>
              </div>
            </div>
          )}

          {/* User Detail View */}
          {showUserDetail && selectedUser ? (
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
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {/* Basic Information */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '24px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Basic Information</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>ID:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.id}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Email Address:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.email}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>First Name:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.firstName}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Last Name:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.lastName}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>User Name:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.userName}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Phone:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.phone}</span>
                  </div>
                </div>

                {/* Account & Role */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '24px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Account & Role</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Status:</strong>
                    <span style={{ 
                      marginLeft: '8px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: selectedUser.isActive ? '#e8f5e9' : '#ffebee',
                      color: selectedUser.isActive ? '#2e7d32' : '#c62828'
                    }}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Role:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.role}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Company:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.companyName}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Account ID:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px', fontFamily: 'monospace' }}>{selectedUser.accountId}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Is Active:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>
                      {selectedUser.isActive ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>

                {/* Employment Details */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '24px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Employment Details</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Employee ID:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.employeeId}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Department:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.department}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Job Title:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.jobTitle}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Location:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.location}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Country:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.country}</span>
                  </div>
                </div>

                {/* Activity */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '24px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>Activity</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Last Login:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.lastLoginAt}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Created At:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.createdAt}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#333', fontSize: '14px' }}>Updated At:</strong>
                    <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>{selectedUser.updatedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Loading State */}
              {loading && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '16px', color: '#666' }}>Loading users data...</div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#fee',
                  borderRadius: '8px',
                  border: '1px solid #fcc',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', color: '#c00', fontWeight: '500' }}>{error}</div>
                </div>
              )}

              {/* Filter Section */}
              {!loading && !error && (
              <div style={{
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e1e5e9',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <input
                    type="text"
                    placeholder="Filter by email address"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e1e5e9',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '200px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Filter by phone number"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e1e5e9',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '200px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e1e5e9',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '180px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="">All Roles</option>
                    <option value="CORPORATE_ADMIN">Corporate Admin</option>
                    <option value="CORPORATE_USER">Corporate User</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="B2C_CUSTOMER">B2C Customer</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e1e5e9',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '150px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DEACTIVATED">Deactivated</option>
                    <option value="DELETED">Deleted</option>
                  </select>
                  <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
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
                      + ADD NEW USER
                    </button>
                    <button
                      onClick={() => setShowBulkUploadModal(true)}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#218838'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#28a745'
                      }}
                    >
                      CREATE USERS IN BULK
                    </button>
                    <button
                      onClick={() => setShowColumnsModal(true)}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#5a6268'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#6c757d'
                      }}
                    >
                      ☰ COLUMNS
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Users Table */}
              {!loading && !error && (
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
                      {getVisibleColumns().map((column) => (
                        <th 
                          key={column.key}
                          style={{
                            textAlign: 'left',
                            padding: '16px',
                            borderBottom: '1px solid #e1e5e9',
                            fontWeight: '600',
                            color: '#1a1a1a',
                            cursor: column.key === 'id' ? 'pointer' : 'default',
                            userSelect: 'none',
                            width: column.key === 'edit' ? '80px' : 'auto'
                          }}
                          onClick={column.key === 'id' ? handleSort : undefined}
                        >
                          {column.key === 'id' ? `ID ${sortOrder === 'asc' ? '↑' : '↓'}` : column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user, index) => (
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
                        {getVisibleColumns().map((column) => {
                          const getCellValue = (user: User, key: string) => {
                            switch (key) {
                              case 'edit':
                                return (
                                  <button
                                    style={{
                                      backgroundColor: '#1976d2',
                                      color: 'white',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.backgroundColor = '#1565c0'
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.backgroundColor = '#1976d2'
                                    }}
                                  >
                                    ✏️ EDIT
                                  </button>
                                )
                              case 'id':
                                return <span style={{ fontWeight: '500' }}>{user.id}</span>
                              case 'email':
                                return user.email
                              case 'firstName':
                                return user.firstName
                              case 'lastName':
                                return user.lastName
                              case 'userName':
                                return user.userName
                              case 'phone':
                                return user.phone
                              case 'role':
                                return (
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2'
                                  }}>
                                    {user.role}
                                  </span>
                                )
                              case 'status':
                                return (
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: user.isActive ? '#e8f5e9' : '#ffebee',
                                    color: user.isActive ? '#2e7d32' : '#c62828'
                                  }}>
                                    {user.status}
                                  </span>
                                )
                              case 'companyName':
                                return user.companyName
                              case 'accountId':
                                return <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{user.accountId}</span>
                              case 'department':
                                return user.department
                              case 'jobTitle':
                                return user.jobTitle
                              case 'employeeId':
                                return user.employeeId
                              case 'location':
                                return user.location
                              case 'country':
                                return user.country
                              case 'lastLoginAt':
                                return user.lastLoginAt
                              case 'createdAt':
                                return user.createdAt
                              case 'updatedAt':
                                return user.updatedAt
                              default:
                                return ''
                            }
                          }

                          return (
                            <td 
                              key={column.key}
                              style={{
                                padding: '16px',
                                borderBottom: '1px solid #e1e5e9',
                                color: '#333333'
                              }}
                            >
                              {getCellValue(user, column.key)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {/* Pagination */}
              {!loading && !error && (
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                  {renderPageNumbers()}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
            </>
          )}

          {/* Add User Modal */}
          {showAddUserModal && (
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
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '30px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>Add New User</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name *</label>
                    <input
                      type="text"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name *</label>
                    <input
                      type="text"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone</label>
                    <input
                      type="text"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="CORPORATE_USER">Corporate User</option>
                      <option value="CORPORATE_ADMIN">Corporate Admin</option>
                      <option value="B2C_CUSTOMER">B2C Customer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City *</label>
                    <input
                      type="text"
                      value={newUser.city}
                      onChange={(e) => setNewUser({...newUser, city: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State *</label>
                    <input
                      type="text"
                      value={newUser.state}
                      onChange={(e) => setNewUser({...newUser, state: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Country *</label>
                    <input
                      type="text"
                      value={newUser.country}
                      onChange={(e) => setNewUser({...newUser, country: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Country Code *</label>
                    <input
                      type="text"
                      value={newUser.countryCode}
                      onChange={(e) => setNewUser({...newUser, countryCode: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Code *</label>
                    <input
                      type="text"
                      value={newUser.phoneCode}
                      onChange={(e) => setNewUser({...newUser, phoneCode: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Location *</label>
                    <input
                      type="text"
                      value={newUser.location}
                      onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: isSubmitting ? '#ccc' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Upload Modal */}
          {showBulkUploadModal && (
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
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '30px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>Bulk Upload Users</h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    Upload a CSV file with user data. Required columns:
                  </p>
                  <div style={{ fontSize: '12px', color: '#888', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                    EmailID*, LoginPassword*, FirstName*, LastName*, ContactNo*, IsCompany*, CompanyID*, PlanStartDate*, PlanExpiryDate*, AccountStatus*
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  {selectedFile && (
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                
                {uploadResults && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Upload Results:</h4>
                    <p>Successfully created: {uploadResults.successCount} users</p>
                    <p>Errors: {uploadResults.errorCount}</p>
                    {uploadResults.errors.length > 0 && (
                      <div>
                        <strong>Errors:</strong>
                        <ul style={{ fontSize: '12px', marginTop: '5px' }}>
                          {uploadResults.errors.slice(0, 5).map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowBulkUploadModal(false)
                      setSelectedFile(null)
                      setUploadResults(null)
                    }}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={isUploading || !selectedFile}
                    style={{
                      backgroundColor: isUploading || !selectedFile ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Users'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Columns Configuration Modal */}
          {showColumnsModal && (
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
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '30px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>Configure Columns</h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                    Toggle columns on/off and drag to reorder them. Changes will be applied immediately.
                  </p>
                  
                  <div style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    border: '1px solid #e1e5e9',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    {columnConfig
                      .sort((a, b) => a.order - b.order)
                      .map((column, index) => (
                        <div
                          key={column.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: index < columnConfig.length - 1 ? '1px solid #e1e5e9' : 'none',
                            backgroundColor: column.visible ? '#ffffff' : '#f5f5f5',
                            opacity: column.visible ? 1 : 0.6
                          }}
                        >
                          {/* Toggle Switch */}
                          <div style={{ marginRight: '15px' }}>
                            <label style={{ 
                              position: 'relative', 
                              display: 'inline-block', 
                              width: '50px', 
                              height: '24px' 
                            }}>
                              <input
                                type="checkbox"
                                checked={column.visible}
                                onChange={() => toggleColumn(column.key)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: column.visible ? '#1976d2' : '#ccc',
                                borderRadius: '24px',
                                transition: '0.3s'
                              }}>
                                <span style={{
                                  position: 'absolute',
                                  content: '""',
                                  height: '18px',
                                  width: '18px',
                                  left: column.visible ? '28px' : '3px',
                                  bottom: '3px',
                                  backgroundColor: 'white',
                                  borderRadius: '50%',
                                  transition: '0.3s',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }} />
                              </span>
                            </label>
                          </div>
                          
                          {/* Column Label */}
                          <div style={{ 
                            flex: 1, 
                            fontSize: '14px', 
                            fontWeight: column.visible ? '500' : '400',
                            color: column.visible ? '#333' : '#666'
                          }}>
                            {column.label}
                          </div>
                          
                          {/* Drag Handle */}
                          <div style={{ 
                            cursor: 'grab',
                            padding: '4px',
                            color: '#999',
                            fontSize: '12px'
                          }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '2px',
                              width: '12px',
                              height: '12px'
                            }}>
                              {[...Array(4)].map((_, i) => (
                                <div
                                  key={i}
                                  style={{
                                    width: '2px',
                                    height: '2px',
                                    backgroundColor: '#999',
                                    borderRadius: '50%'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowColumnsModal(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
