'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

interface B2CCustomer {
  id: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  phone: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  phoneCode: string;
  location: string;
  branch?: string;
  department?: string;
  role: string;
  employeeCode?: string;
  companyName?: string;
  gst?: string;
  gstNumber?: string;
  website?: string;
  designation?: string;
  description?: string;
  planId?: string;
  registrationDate: string;
  planStartDate?: string;
  planExpiryDate?: string;
  videoLimit?: number;
  manager?: string;
  alternateEmail?: string;
  isAccountActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  passwordChanged: boolean;
  tempPassword?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    customers: B2CCustomer[];
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

export default function B2CUsersPage() {
  const [emailFilter, setEmailFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [planExpiryFilter, setPlanExpiryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [b2cUsersData, setB2cUsersData] = useState<B2CCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  })
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<B2CCustomer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  
  // Column visibility state - all fields from the image
  const [visibleColumns, setVisibleColumns] = useState({
    edit: true,
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    userName: true,
    phone: true,
    address: false,
    city: false,
    state: false,
    country: false,
    branch: false,
    department: false,
    role: false,
    employeeCode: false,
    companyName: false,
    gst: false,
    gstNumber: false,
    website: false,
    designation: false,
    description: false,
    planId: false,
    registrationDate: false,
    planStartDate: false,
    planExpiryDate: false,
    videoLimit: false,
    manager: false,
    alternateEmail: false,
    isActive: true,
    tempPassword: false
  })

  // Add user form state with all fields from the image
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    countryCode: '',
    phoneCode: '',
    location: '',
    branch: '',
    department: '',
    employeeCode: '',
    companyName: '',
    gst: '',
    gstNumber: '',
    website: '',
    designation: '',
    description: '',
    planId: '',
    planStartDate: '',
    planExpiryDate: '',
    videoLimit: '',
    manager: '',
    alternateEmail: ''
  })

  // Fetch B2C users data from API
  const fetchB2CUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString(),
        ...(emailFilter && { email: emailFilter }),
        ...(phoneFilter && { phone: phoneFilter })
      })

      const url = `/api/super-admin/b2c-users?${params}`
      console.log('Fetching B2C users from:', url)
      
      const response = await fetch(url)
      const data: ApiResponse = await response.json()

      console.log('API Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch B2C users')
      }

      setB2cUsersData(data.data.customers)
      setPagination(data.data.pagination)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching B2C users')
      console.error('Error fetching B2C users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchB2CUsers()
  }, [currentPage, rowsPerPage, emailFilter, phoneFilter])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [emailFilter, phoneFilter])

  const totalPages = pagination.totalPages
  const totalRecords = pagination.totalCount
  const currentUsers = b2cUsersData

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

  // Handle adding new B2C user
  const handleAddUser = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate required fields (only main fields are mandatory)
      if (!newUser.firstName || !newUser.lastName || !newUser.userName || !newUser.email || !newUser.phone || !newUser.city || !newUser.state || !newUser.country || !newUser.countryCode || !newUser.phoneCode || !newUser.location) {
        alert('Please fill in all required fields (First Name, Last Name, User Name, Email, Phone, City, State, Country, Country Code, Phone Code, Location)')
        return
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        alert('Please enter a valid email address')
        return
      }

      const response = await fetch('/api/super-admin/b2c-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          userName: newUser.userName,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address || null,
          city: newUser.city,
          state: newUser.state,
          country: newUser.country,
          countryCode: newUser.countryCode,
          phoneCode: newUser.phoneCode,
          location: newUser.location,
          branch: newUser.branch || null,
          department: newUser.department || null,
          employeeCode: newUser.employeeCode || null,
          companyName: newUser.companyName || null,
          gst: newUser.gst || null,
          gstNumber: newUser.gstNumber || null,
          website: newUser.website || null,
          designation: newUser.designation || null,
          description: newUser.description || null,
          planId: newUser.planId || null,
          planStartDate: newUser.planStartDate || null,
          planExpiryDate: newUser.planExpiryDate || null,
          videoLimit: newUser.videoLimit ? parseInt(newUser.videoLimit) : null,
          manager: newUser.manager || null,
          alternateEmail: newUser.alternateEmail || null
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Show temporary password
        const tempPassword = data.data.tempPassword
        const userEmail = data.data.email
        
        // Reset form
        setNewUser({
          firstName: '',
          lastName: '',
          userName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: '',
          countryCode: '',
          phoneCode: '',
          location: '',
          branch: '',
          department: '',
          employeeCode: '',
          companyName: '',
          gst: '',
          gstNumber: '',
          website: '',
          designation: '',
          description: '',
          planId: '',
          planStartDate: '',
          planExpiryDate: '',
          videoLimit: '',
          manager: '',
          alternateEmail: ''
        })
        setShowAddUserModal(false)
        
        // Refresh the user list
        fetchB2CUsers()
        
        // Show success message with temp password
        alert(`B2C user created successfully!\nEmail: ${userEmail}\nTemporary Password: ${tempPassword}`)
      } else {
        alert(data.error || 'Failed to create B2C user')
      }
    } catch (error) {
      console.error('Error creating B2C user:', error)
      alert('An error occurred while creating the B2C user')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle editing B2C user
  const handleEditUser = async () => {
    if (!editingUser) return;
    
    try {
      setIsUpdating(true)
      
      // Validate required fields (only main fields are mandatory)
      if (!editingUser.firstName || !editingUser.lastName || !editingUser.userName || !editingUser.email || !editingUser.phone || !editingUser.city || !editingUser.state || !editingUser.country || !editingUser.countryCode || !editingUser.phoneCode || !editingUser.location) {
        alert('Please fill in all required fields (First Name, Last Name, User Name, Email, Phone, City, State, Country, Country Code, Phone Code, Location)')
        return
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editingUser.email)) {
        alert('Please enter a valid email address')
        return
      }

      const response = await fetch('/api/super-admin/b2c-users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          userName: editingUser.userName,
          email: editingUser.email,
          phone: editingUser.phone,
          address: editingUser.address || null,
          city: editingUser.city,
          state: editingUser.state,
          country: editingUser.country,
          countryCode: editingUser.countryCode,
          phoneCode: editingUser.phoneCode,
          location: editingUser.location,
          branch: editingUser.branch || null,
          department: editingUser.department || null,
          employeeCode: editingUser.employeeCode || null,
          companyName: editingUser.companyName || null,
          gst: editingUser.gst || null,
          gstNumber: editingUser.gstNumber || null,
          website: editingUser.website || null,
          designation: editingUser.designation || null,
          description: editingUser.description || null,
          planId: editingUser.planId || null,
          planStartDate: editingUser.planStartDate || null,
          planExpiryDate: editingUser.planExpiryDate || null,
          videoLimit: editingUser.videoLimit || null,
          manager: editingUser.manager || null,
          alternateEmail: editingUser.alternateEmail || null,
          isAccountActive: editingUser.isAccountActive
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setShowEditUserModal(false)
        setEditingUser(null)
        
        // Refresh the user list
        fetchB2CUsers()
        
        alert('B2C user updated successfully!')
      } else {
        alert(data.error || 'Failed to update B2C user')
      }
    } catch (error) {
      console.error('Error updating B2C user:', error)
      alert('An error occurred while updating the B2C user')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle edit button click
  const handleEditClick = (user: B2CCustomer, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setEditingUser(user);
    setShowEditUserModal(true);
  }

  // Handle column visibility toggle
  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  }

  // Handle columns button click
  const handleColumnsClick = () => {
    setShowColumnModal(true);
  }

  // Handle export button click
  const handleExportClick = async () => {
    try {
      setExportLoading(true)
      
      // Fetch all B2C users for export (without pagination)
      const response = await fetch('/api/super-admin/b2c-users?page=1&limit=10000')
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        const users = data.data.users
        
        // Create CSV content
        const headers = ['ID', 'Email', 'First Name', 'Last Name', 'User Name', 'Phone', 'Address', 'City', 'State', 'Country', 'Branch', 'Department', 'Role', 'Employee Code', 'Company Name', 'GST', 'GST Number', 'Website', 'Designation', 'Description', 'Status', 'Plan Expiry', 'Created At', 'Updated At']
        const csvContent = [
          headers.join(','),
          ...users.map(user => [
            user.id,
            `"${user.email || ''}"`,
            `"${user.firstName || ''}"`,
            `"${user.lastName || ''}"`,
            `"${user.userName || ''}"`,
            `"${user.phone || ''}"`,
            `"${user.address || ''}"`,
            `"${user.city || ''}"`,
            `"${user.state || ''}"`,
            `"${user.country || ''}"`,
            `"${user.branch || ''}"`,
            `"${user.department || ''}"`,
            `"${user.role || ''}"`,
            `"${user.employeeCode || ''}"`,
            `"${user.companyName || ''}"`,
            `"${user.gst || ''}"`,
            `"${user.gstNumber || ''}"`,
            `"${user.website || ''}"`,
            `"${user.designation || ''}"`,
            `"${user.description || ''}"`,
            user.status === 'ACTIVE' ? 'Active' : 'Inactive',
            user.planExpiry ? new Date(user.planExpiry).toLocaleDateString() : 'N/A',
            user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A',
            user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'
          ].join(','))
        ].join('\n')
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `b2c-users-export-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert(`Successfully exported ${users.length} B2C users`)
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

  // Toggle column visibility
  const toggleColumn = (columnKey: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
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
      <Sidebar activeItem="b2c-users" title={showUserDetail ? `B2C Users #${selectedUser?.id}` : "All users"} />

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
            {showUserDetail ? `B2C Users #${selectedUser?.id}` : 'All users'}
          </h1>

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
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '24px',
                border: '1px solid #e1e5e9'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>ID:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.id}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Email Address:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.email}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>First Name:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.firstName}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Last Name:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.lastName}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>User Name:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.userName}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Phone:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>{selectedUser.phone}</span>
                </div>
                <div>
                  <strong style={{ color: '#333', fontSize: '16px' }}>Is account active?:</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '16px' }}>
                    {selectedUser.isActive ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Filter Section */}
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
                  <input
                    type="date"
                    placeholder="Filter by plan expiry date dd/mm/yyyy"
                    value={planExpiryFilter}
                    onChange={(e) => setPlanExpiryFilter(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e1e5e9',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '200px',
                      backgroundColor: '#ffffff'
                    }}
                  />
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
                      onClick={handleColumnsClick}
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
                    <button
                      onClick={handleExportClick}
                      disabled={exportLoading}
                      style={{
                        backgroundColor: exportLoading ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
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
                </div>
              </div>

              {/* Users Table */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e1e5e9',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                overflowX: 'auto',
                overflowY: 'hidden',
                position: 'relative'
              }}>
                <table style={{
                  width: '100%',
                  minWidth: '2000px', // Ensure table is wide enough to scroll
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      {visibleColumns.edit && (
                      <th style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        width: '80px'
                      }}>EDIT</th>
                      )}
                      {visibleColumns.id && (
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
                        ID {sortOrder === 'asc' ? '↑' : '↓'}
                      </th>
                      )}
                      {visibleColumns.email && (
                      <th style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>Email Address</th>
                      )}
                      {visibleColumns.firstName && (
                      <th style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>First Name</th>
                      )}
                      {visibleColumns.lastName && (
                      <th style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>Last Name</th>
                      )}
                      {visibleColumns.userName && (
                      <th style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>User Name</th>
                      )}
                      {visibleColumns.phone && (
                      <th style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>Phone</th>
                      )}
                      {visibleColumns.address && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Address</th>
                      )}
                      {visibleColumns.city && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>City</th>
                      )}
                      {visibleColumns.state && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>State</th>
                      )}
                      {visibleColumns.country && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Country</th>
                      )}
                      {visibleColumns.branch && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Branch</th>
                      )}
                      {visibleColumns.department && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Department</th>
                      )}
                      {visibleColumns.role && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Role</th>
                      )}
                      {visibleColumns.employeeCode && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Employee Code</th>
                      )}
                      {visibleColumns.companyName && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Company Name</th>
                      )}
                      {visibleColumns.gst && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>GST</th>
                      )}
                      {visibleColumns.gstNumber && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>GST Number</th>
                      )}
                      {visibleColumns.website && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Website</th>
                      )}
                      {visibleColumns.designation && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Designation</th>
                      )}
                      {visibleColumns.description && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Description</th>
                      )}
                      {visibleColumns.planId && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Plan ID</th>
                      )}
                      {visibleColumns.registrationDate && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Registration Date</th>
                      )}
                      {visibleColumns.planStartDate && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Plan Start Date</th>
                      )}
                      {visibleColumns.planExpiryDate && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Plan Expiry Date</th>
                      )}
                      {visibleColumns.videoLimit && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Video Limit</th>
                      )}
                      {visibleColumns.manager && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Manager</th>
                      )}
                      {visibleColumns.alternateEmail && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Alternate Email</th>
                      )}
                      {visibleColumns.isActive && (
                      <th style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>Is account active?</th>
                      )}
                      {visibleColumns.tempPassword && (
                        <th style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>Temp Password</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length} style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#666',
                          fontSize: '16px'
                        }}>
                          Loading B2C users data...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length} style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#d32f2f',
                          fontSize: '16px'
                        }}>
                          Error: {error}
                        </td>
                      </tr>
                    ) : currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length} style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#666',
                          fontSize: '16px'
                        }}>
                          No B2C users found
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((user, index) => (
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
                          {visibleColumns.edit && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333'
                        }}>
                          <button
                                onClick={(e) => handleEditClick(user, e)}
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
                        </td>
                          )}
                          {visibleColumns.id && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333',
                          fontWeight: '500'
                        }}>{user.id}</td>
                          )}
                          {visibleColumns.email && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333'
                        }}>{user.email}</td>
                          )}
                          {visibleColumns.firstName && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333'
                        }}>{user.firstName}</td>
                          )}
                          {visibleColumns.lastName && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333'
                        }}>{user.lastName}</td>
                          )}
                          {visibleColumns.userName && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333'
                        }}>{user.userName}</td>
                          )}
                          {visibleColumns.phone && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333'
                        }}>{user.phone}</td>
                          )}
                          {visibleColumns.address && (
                        <td style={{
                          padding: '16px',
                          borderBottom: '1px solid #e1e5e9',
                          color: '#333333'
                            }}>{user.address || '-'}</td>
                          )}
                          {visibleColumns.city && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.city || '-'}</td>
                          )}
                          {visibleColumns.state && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.state || '-'}</td>
                          )}
                          {visibleColumns.country && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.country || '-'}</td>
                          )}
                          {visibleColumns.branch && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.branch || '-'}</td>
                          )}
                          {visibleColumns.department && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.department || '-'}</td>
                          )}
                          {visibleColumns.role && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.role || '-'}</td>
                          )}
                          {visibleColumns.employeeCode && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.employeeCode || '-'}</td>
                          )}
                          {visibleColumns.companyName && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.companyName || '-'}</td>
                          )}
                          {visibleColumns.gst && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.gst || '-'}</td>
                          )}
                          {visibleColumns.gstNumber && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.gstNumber || '-'}</td>
                          )}
                          {visibleColumns.website && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.website || '-'}</td>
                          )}
                          {visibleColumns.designation && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.designation || '-'}</td>
                          )}
                          {visibleColumns.description && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{user.description || '-'}</td>
                          )}
                          {visibleColumns.planId && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.planId || '-'}</td>
                          )}
                          {visibleColumns.registrationDate && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : '-'}</td>
                          )}
                          {visibleColumns.planStartDate && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.planStartDate ? new Date(user.planStartDate).toLocaleDateString() : '-'}</td>
                          )}
                          {visibleColumns.planExpiryDate && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.planExpiryDate ? new Date(user.planExpiryDate).toLocaleDateString() : '-'}</td>
                          )}
                          {visibleColumns.videoLimit && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.videoLimit || '-'}</td>
                          )}
                          {visibleColumns.manager && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.manager || '-'}</td>
                          )}
                          {visibleColumns.alternateEmail && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.alternateEmail || '-'}</td>
                          )}
                          {visibleColumns.isActive && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>{user.isAccountActive ? '✓' : '✗'}</td>
                          )}
                          {visibleColumns.tempPassword && (
                            <td style={{
                              padding: '16px',
                              borderBottom: '1px solid #e1e5e9',
                              color: '#333333'
                            }}>
                              {!user.passwordChanged && user.tempPassword ? (
                                <span style={{
                                  backgroundColor: '#fff3cd',
                                  color: '#856404',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {user.tempPassword}
                                </span>
                              ) : (
                                <span style={{
                                  color: '#6c757d',
                                  fontSize: '12px',
                                  fontStyle: 'italic'
                                }}>
                                  Changed
                                </span>
                              )}
                            </td>
                          )}
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
                  {loading ? 'Loading...' : `${((currentPage - 1) * rowsPerPage) + 1}-${Math.min(currentPage * rowsPerPage, totalRecords)} of ${totalRecords}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: (currentPage === 1 || loading) ? '#f5f5f5' : '#ffffff',
                      color: (currentPage === 1 || loading) ? '#ccc' : '#333',
                      cursor: (currentPage === 1 || loading) ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    &lt;
                  </button>
                  {renderPageNumbers()}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: (currentPage === totalPages || loading) ? '#f5f5f5' : '#ffffff',
                      color: (currentPage === totalPages || loading) ? '#ccc' : '#333',
                      cursor: (currentPage === totalPages || loading) ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

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
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: '800px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Add New B2C User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Basic Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name *</label>
                    <input
                      type="text"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name *</label>
                    <input
                      type="text"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>User Name *</label>
                    <input
                      type="text"
                      value={newUser.userName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, userName: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone *</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Alternate Email</label>
                    <input
                      type="email"
                      value={newUser.alternateEmail}
                      onChange={(e) => setNewUser(prev => ({ ...prev, alternateEmail: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Address Information</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
                  <input
                    type="text"
                    value={newUser.address}
                    onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City *</label>
                    <input
                      type="text"
                      value={newUser.city}
                      onChange={(e) => setNewUser(prev => ({ ...prev, city: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State *</label>
                    <input
                      type="text"
                      value={newUser.state}
                      onChange={(e) => setNewUser(prev => ({ ...prev, state: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Country *</label>
                    <input
                      type="text"
                      value={newUser.country}
                      onChange={(e) => setNewUser(prev => ({ ...prev, country: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Country Code *</label>
                    <input
                      type="text"
                      value={newUser.countryCode}
                      onChange={(e) => setNewUser(prev => ({ ...prev, countryCode: e.target.value }))}
                      placeholder="e.g., IN, US, UK"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Code *</label>
                    <input
                      type="text"
                      value={newUser.phoneCode}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phoneCode: e.target.value }))}
                      placeholder="e.g., +91, +1, +44"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Location *</label>
                    <select
                      value={newUser.location}
                      onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">Select location</option>
                      <option value="North America">North America</option>
                      <option value="South America">South America</option>
                      <option value="Europe">Europe</option>
                      <option value="Middle East">Middle East</option>
                      <option value="Asia">Asia</option>
                      <option value="Africa">Africa</option>
                      <option value="Oceania">Oceania</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Company Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Company Name</label>
                    <input
                      type="text"
                      value={newUser.companyName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, companyName: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Website</label>
                    <input
                      type="url"
                      value={newUser.website}
                      onChange={(e) => setNewUser(prev => ({ ...prev, website: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>GST</label>
                    <input
                      type="text"
                      value={newUser.gst}
                      onChange={(e) => setNewUser(prev => ({ ...prev, gst: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>GST Number</label>
                    <input
                      type="text"
                      value={newUser.gstNumber}
                      onChange={(e) => setNewUser(prev => ({ ...prev, gstNumber: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Job Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Branch</label>
                    <input
                      type="text"
                      value={newUser.branch}
                      onChange={(e) => setNewUser(prev => ({ ...prev, branch: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Department</label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Designation</label>
                    <input
                      type="text"
                      value={newUser.designation}
                      onChange={(e) => setNewUser(prev => ({ ...prev, designation: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Employee Code</label>
                    <input
                      type="text"
                      value={newUser.employeeCode}
                      onChange={(e) => setNewUser(prev => ({ ...prev, employeeCode: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Manager</label>
                    <input
                      type="text"
                      value={newUser.manager}
                      onChange={(e) => setNewUser(prev => ({ ...prev, manager: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                  <textarea
                    value={newUser.description}
                    onChange={(e) => setNewUser(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Plan Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Plan Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Plan ID</label>
                    <input
                      type="text"
                      value={newUser.planId}
                      onChange={(e) => setNewUser(prev => ({ ...prev, planId: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Plan Start Date</label>
                    <input
                      type="date"
                      value={newUser.planStartDate}
                      onChange={(e) => setNewUser(prev => ({ ...prev, planStartDate: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Plan Expiry Date</label>
                    <input
                      type="date"
                      value={newUser.planExpiryDate}
                      onChange={(e) => setNewUser(prev => ({ ...prev, planExpiryDate: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Video Limit</label>
                  <input
                    type="number"
                    value={newUser.videoLimit}
                    onChange={(e) => setNewUser(prev => ({ ...prev, videoLimit: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowAddUserModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: isSubmitting ? '#ccc' : '#1976d2',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
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
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: '800px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Edit B2C User</h2>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Basic Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name *</label>
                    <input
                      type="text"
                      value={editingUser.firstName}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name *</label>
                    <input
                      type="text"
                      value={editingUser.lastName}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>User Name *</label>
                    <input
                      type="text"
                      value={editingUser.userName}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, userName: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email *</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone *</label>
                    <input
                      type="tel"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Alternate Email</label>
                    <input
                      type="email"
                      value={editingUser.alternateEmail || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, alternateEmail: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Address Information</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
                  <input
                    type="text"
                    value={editingUser.address || ''}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, address: e.target.value } : null)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City *</label>
                    <input
                      type="text"
                      value={editingUser.city}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, city: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State *</label>
                    <input
                      type="text"
                      value={editingUser.state}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, state: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Country *</label>
                    <input
                      type="text"
                      value={editingUser.country}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, country: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Country Code *</label>
                    <input
                      type="text"
                      value={editingUser.countryCode}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, countryCode: e.target.value } : null)}
                      placeholder="e.g., IN, US, UK"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Code *</label>
                    <input
                      type="text"
                      value={editingUser.phoneCode}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, phoneCode: e.target.value } : null)}
                      placeholder="e.g., +91, +1, +44"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Location *</label>
                    <select
                      value={editingUser.location}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, location: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">Select location</option>
                      <option value="North America">North America</option>
                      <option value="South America">South America</option>
                      <option value="Europe">Europe</option>
                      <option value="Middle East">Middle East</option>
                      <option value="Asia">Asia</option>
                      <option value="Africa">Africa</option>
                      <option value="Oceania">Oceania</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Company Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Company Name</label>
                    <input
                      type="text"
                      value={editingUser.companyName || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Website</label>
                    <input
                      type="url"
                      value={editingUser.website || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, website: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>GST</label>
                    <input
                      type="text"
                      value={editingUser.gst || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, gst: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>GST Number</label>
                    <input
                      type="text"
                      value={editingUser.gstNumber || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, gstNumber: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Job Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Branch</label>
                    <input
                      type="text"
                      value={editingUser.branch || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, branch: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Department</label>
                    <input
                      type="text"
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, department: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Designation</label>
                    <input
                      type="text"
                      value={editingUser.designation || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, designation: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Employee Code</label>
                    <input
                      type="text"
                      value={editingUser.employeeCode || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, employeeCode: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Manager</label>
                    <input
                      type="text"
                      value={editingUser.manager || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, manager: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Is Account Active</label>
                    <select
                      value={editingUser.isAccountActive ? 'true' : 'false'}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, isAccountActive: e.target.value === 'true' } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                  <textarea
                    value={editingUser.description || ''}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Plan Information */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Plan Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Plan ID</label>
                    <input
                      type="text"
                      value={editingUser.planId || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, planId: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Plan Start Date</label>
                    <input
                      type="date"
                      value={editingUser.planStartDate ? editingUser.planStartDate.split('T')[0] : ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, planStartDate: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Plan Expiry Date</label>
                    <input
                      type="date"
                      value={editingUser.planExpiryDate ? editingUser.planExpiryDate.split('T')[0] : ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, planExpiryDate: e.target.value } : null)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Video Limit</label>
                  <input
                    type="number"
                    value={editingUser.videoLimit || ''}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, videoLimit: parseInt(e.target.value) || 0 } : null)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                disabled={isUpdating}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: isUpdating ? '#ccc' : '#1976d2',
                  color: 'white',
                  cursor: isUpdating ? 'not-allowed' : 'pointer'
                }}
              >
                {isUpdating ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Column Visibility</h2>
              <button
                onClick={() => setShowColumnModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {Object.entries(visibleColumns).map(([key, isVisible]) => {
                const columnLabels: { [key: string]: string } = {
                  edit: 'Edit Button',
                  id: 'ID',
                  email: 'Email Address',
                  firstName: 'First Name',
                  lastName: 'Last Name',
                  userName: 'User Name',
                  phone: 'Phone',
                  address: 'Address',
                  city: 'City',
                  state: 'State',
                  country: 'Country',
                  branch: 'Branch',
                  department: 'Department',
                  role: 'Role',
                  employeeCode: 'Employee Code',
                  companyName: 'Company Name',
                  gst: 'GST',
                  gstNumber: 'GST Number',
                  website: 'Website',
                  designation: 'Designation',
                  description: 'Description',
                  planId: 'Plan ID',
                  registrationDate: 'Registration Date',
                  planStartDate: 'Plan Start Date',
                  planExpiryDate: 'Plan Expiry Date',
                  videoLimit: 'Video Limit',
                  manager: 'Manager',
                  alternateEmail: 'Alternate Email',
                  isActive: 'Is account active?',
                  tempPassword: 'Temp Password'
                };

                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: isVisible ? '#f0f8ff' : 'transparent',
                      border: '1px solid',
                      borderColor: isVisible ? '#1976d2' : '#e1e5e9'
                    }}
                  >
                    <div
                      onClick={() => toggleColumn(key as keyof typeof visibleColumns)}
                      style={{
                        width: '40px',
                        height: '20px',
                        backgroundColor: isVisible ? '#3b82f6' : '#6b7280',
                        borderRadius: '10px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '2px',
                          left: isVisible ? '22px' : '2px',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isVisible ? '500' : '400',
                      color: isVisible ? '#1976d2' : '#333',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}>
                      {columnLabels[key] || key}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  // Show all columns
                  setVisibleColumns({
                    edit: true,
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    userName: true,
                    phone: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                    branch: true,
                    department: true,
                    role: true,
                    employeeCode: true,
                    companyName: true,
                    gst: true,
                    gstNumber: true,
                    website: true,
                    designation: true,
                    description: true,
                    planId: true,
                    registrationDate: true,
                    planStartDate: true,
                    planExpiryDate: true,
                    videoLimit: true,
                    manager: true,
                    alternateEmail: true,
                    isActive: true,
                    tempPassword: true
                  });
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Show All
              </button>
              <button
                onClick={() => {
                  // Hide all columns except edit
                  setVisibleColumns({
                    edit: true,
                    id: false,
                    email: false,
                    firstName: false,
                    lastName: false,
                    userName: false,
                    phone: false,
                    address: false,
                    city: false,
                    state: false,
                    country: false,
                    branch: false,
                    department: false,
                    role: false,
                    employeeCode: false,
                    companyName: false,
                    gst: false,
                    gstNumber: false,
                    website: false,
                    designation: false,
                    description: false,
                    planId: false,
                    registrationDate: false,
                    planStartDate: false,
                    planExpiryDate: false,
                    videoLimit: false,
                    manager: false,
                    alternateEmail: false,
                    isActive: false,
                    tempPassword: false
                  });
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Hide All
              </button>
              <button
                onClick={() => setShowColumnModal(false)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
