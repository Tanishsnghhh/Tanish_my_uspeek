'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import Sidebar from '../../../components/super-admin/Sidebar'

// Interface for B2B admin user data
interface B2BAdminUser {
  id: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  phone: string;
  role: string;
  status: string;
  accountId: string | null;
  accountName: string | null;
  companyName: string | null;
  businessCode: string | null;
  region: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  planExpiryDate: string | null;
  isActive: boolean;
  passwordChanged: boolean;
  tempPassword: string | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    users: B2BAdminUser[];
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


export default function B2BAdminUsersPage() {
  const [emailFilter, setEmailFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  
  // Add user form state
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    accountId: '',
    city: '',
    state: '',
    country: '',
    countryCode: '',
    phoneCode: '',
    location: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Bulk upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  
  // Dynamic data state
  const [b2bUsersData, setB2bUsersData] = useState<B2BAdminUser[]>([])
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

  // Fetch B2B admin users from API
  const fetchB2BAdminUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString()
      })
      
      if (emailFilter) params.append('email', emailFilter)
      if (phoneFilter) params.append('phone', phoneFilter)
      
      const response = await fetch(`/api/super-admin/b2b-admin-users?${params}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setB2bUsersData(data.data.users)
        setPagination(data.data.pagination)
      } else {
        setError('Failed to fetch B2B admin users')
      }
    } catch (err) {
      console.error('Error fetching B2B admin users:', err)
      setError('Failed to fetch B2B admin users')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchB2BAdminUsers()
  }, [currentPage, rowsPerPage, emailFilter, phoneFilter])

  // Handle filter changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchB2BAdminUsers()
      } else {
        setCurrentPage(1) // Reset to first page when filters change
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [emailFilter, phoneFilter])

  const totalUsers = pagination.totalCount
  const totalPages = pagination.totalPages

  // Column visibility state - matching the image with key columns visible by default
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    userName: true,
    phone: true,
    role: true,
    accountName: false,
    companyName: false,
    businessCode: false,
    region: false,
    createdAt: false,
    updatedAt: false,
    lastLoginAt: false,
    planExpiryDate: false,
    tempPassword: true,
    isActive: true
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

  // Generate chart data based on selected column from dynamic data
  const generateChartData = (columnKey: string) => {
    if (!b2bUsersData.length) return []

    const columnLabels: { [key: string]: string } = {
      id: 'ID',
      email: 'Email Address',
      firstName: 'First Name',
      lastName: 'Last Name',
      userName: 'User Name',
      phone: 'Phone',
      role: 'Role',
      accountName: 'Account Name',
      companyName: 'Company Name',
      businessCode: 'Business Code',
      region: 'Region',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      lastLoginAt: 'Last Login',
      planExpiryDate: 'Plan Expiry Date',
      tempPassword: 'Temporary Password',
      isActive: 'Is Account Active'
    }

    // Generate dynamic chart data from actual user data
    const valueCounts: { [key: string]: number } = {}
    
    b2bUsersData.forEach(user => {
      let value: any
      
      switch (columnKey) {
        case 'id':
          value = user.id
          break
        case 'email':
          value = user.email
          break
        case 'firstName':
          value = user.firstName
          break
        case 'lastName':
          value = user.lastName
          break
        case 'userName':
          value = user.userName
          break
        case 'phone':
          value = user.phone || 'N/A'
          break
        case 'role':
          value = user.role
          break
        case 'accountName':
          value = user.accountName || 'N/A'
          break
        case 'companyName':
          value = user.companyName || 'N/A'
          break
        case 'businessCode':
          value = user.businessCode || 'N/A'
          break
        case 'region':
          value = user.region || 'N/A'
          break
        case 'createdAt':
          value = new Date(user.createdAt).toLocaleDateString()
          break
        case 'updatedAt':
          value = new Date(user.updatedAt).toLocaleDateString()
          break
        case 'lastLoginAt':
          value = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
          break
        case 'planExpiryDate':
          value = user.planExpiryDate ? new Date(user.planExpiryDate).toLocaleDateString() : 'N/A'
          break
        case 'tempPassword':
          value = user.tempPassword ? 'Has Temp Password' : 'Password Changed'
          break
        case 'isActive':
          value = user.isActive ? 'Active' : 'Inactive'
          break
        default:
          value = 'Unknown'
      }
      
      valueCounts[value] = (valueCounts[value] || 0) + 1
    })

    // Convert to chart data format
    return Object.entries(valueCounts).map(([name, value]) => ({
      name,
      value
    }))
  }

  const handleColumnClick = (columnKey: string) => {
    setSelectedColumn(columnKey)
    const data = generateChartData(columnKey)
    setChartData(data)
    
    // Determine chart type based on data length
    if (data.length <= 5) {
      setChartType('pie')
    } else if (data.length <= 10) {
      setChartType('bar')
    } else {
      setChartType('line')
    }
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
      
      const response = await fetch('/api/super-admin/b2b-admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone || null,
          accountId: newUser.accountId || null,
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
        const userEmail = data.data.email
        
        // Reset form
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          accountId: '',
          city: '',
          state: '',
          country: '',
          countryCode: '',
          phoneCode: '',
          location: ''
        })
        setShowAddUserModal(false)
        
        // Refresh the user list
        fetchB2BAdminUsers()
        
        alert(`B2B Admin User created successfully!\n\nEmail: ${userEmail}\nTemporary Password: ${tempPassword}\n\nPlease share this temporary password with the user. They will be required to change it on first login.`)
      } else {
        alert(data.error || 'Failed to create user')
      }
    } catch (err) {
      console.error('Error creating user:', err)
      alert('Failed to create user. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file to upload')
      return
    }

    try {
      setIsUploading(true)
      setUploadResults(null)

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/super-admin/b2b-admin-users/bulk-upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setUploadResults(data.data)
        setSelectedFile(null)
        
        // Refresh the user list
        fetchB2BAdminUsers()
        
        alert(`Bulk upload completed! ${data.data.successCount} users created, ${data.data.errorCount} errors.`)
      } else {
        alert(data.error || 'Failed to upload file')
      }
    } catch (err) {
      console.error('Error uploading file:', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a CSV file')
        return
      }
      setSelectedFile(file)
      setUploadResults(null)
    }
  }

  // Use the data directly from API (already filtered and paginated)
  const currentUsers = b2bUsersData


  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="b2b-admin-users" title="Admin Panel" />

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
            }}>B2B Admin Users</h1>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={() => setShowAddUserModal(true)}
                style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>+ ADD NEW USER</button>
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
            display: 'flex',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '8px'
              }}>Filter by email address</label>
              <input
                type="text"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="Enter email address"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '8px'
              }}>Filter by phone number</label>
              <input
                type="text"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                placeholder="Enter phone number"
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
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    color: '#1a1a1a',
                    fontWeight: '600',
                    margin: 0
                  }}>Column Visibility</h2>
                  <button
                    onClick={() => setShowColumnModal(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666',
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
                      id: 'ID',
                      email: 'Email Address',
                      firstName: 'First Name',
                      lastName: 'Last Name',
                      userName: 'User Name',
                      phone: 'Phone',
                      role: 'Role',
                      accountName: 'Account Name',
                      companyName: 'Company Name',
                      businessCode: 'Business Code',
                      region: 'Region',
                      createdAt: 'Created At',
                      updatedAt: 'Updated At',
                      lastLoginAt: 'Last Login',
                      planExpiryDate: 'Plan Expiry Date',
                      tempPassword: 'Temporary Password',
                      isActive: 'Is Account Active'
                    }

                    return (
                      <div key={key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e1e5e9'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          color: '#333',
                          fontWeight: '500'
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
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e1e5e9'
                }}>
                  <button
                    onClick={() => setShowColumnModal(false)}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowColumnModal(false)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
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
            backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
            <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    color: '#1a1a1a',
                    fontWeight: '600',
                    margin: 0
                  }}>Add New B2B Admin User</h2>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
              color: '#666',
                      padding: '4px'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '8px'
                    }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
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
                    }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
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
                    }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
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
                    }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number (10 digits)"
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
                    }}>
                      Account ID
                    </label>
                    <input
                      type="text"
                      value={newUser.accountId}
                      onChange={(e) => setNewUser(prev => ({ ...prev, accountId: e.target.value }))}
                      placeholder="Enter account ID (optional)"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  {/* Location Fields */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '8px'
                    }}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={newUser.city}
                      onChange={(e) => setNewUser(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
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
                    }}>
                      State *
                    </label>
                    <input
                      type="text"
                      value={newUser.state}
                      onChange={(e) => setNewUser(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
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
                    }}>
                      Country *
                    </label>
                    <input
                      type="text"
                      value={newUser.country}
                      onChange={(e) => setNewUser(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Enter country"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Country Code Field */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '8px'
                    }}>
                      Country Code *
                    </label>
                    <input
                      type="text"
                      value={newUser.countryCode}
                      onChange={(e) => setNewUser(prev => ({ ...prev, countryCode: e.target.value }))}
                      placeholder="e.g., IN, US, UK"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Phone Code Field */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '8px'
                    }}>
                      Phone Code *
                    </label>
                    <input
                      type="text"
                      value={newUser.phoneCode}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phoneCode: e.target.value }))}
                      placeholder="e.g., +91, +1, +44"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Location Field */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '8px'
                    }}>
                      Location *
                    </label>
                    <select
                      value={newUser.location}
                      onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
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
                  
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd'
                  }}>
                    <p style={{
              fontSize: '12px',
                      color: '#0369a1',
                      margin: 0
                    }}>
                      <strong>Note:</strong> Only CORPORATE_ADMIN role users can be created. The user will be created with ACTIVE status.
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e1e5e9'
                }}>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
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
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    color: '#1a1a1a',
                    fontWeight: '600',
                    margin: 0
                  }}>Create Users in Bulk</h2>
                  <button
                    onClick={() => {
                      setShowBulkUploadModal(false)
                      setSelectedFile(null)
                      setUploadResults(null)
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '4px'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {/* Instructions */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '16px' }}>⚠️</span>
                      <strong style={{ color: '#92400e' }}>PLEASE READ FOLLOWING CAREFULLY</strong>
                    </div>
                    <div style={{ fontSize: '14px', color: '#92400e', lineHeight: '1.5' }}>
                      <p style={{ margin: '0 0 8px 0' }}>
                        • Prepare a CSV file with the required structure (download template below)
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        • Fill in all required fields marked with * (asterisk)
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        • Ensure email addresses are unique and valid
                      </p>
                      <p style={{ margin: '0' }}>
                        • Upload the CSV file and wait for the processing results
                      </p>
                    </div>
                  </div>

                  {/* CSV Structure */}
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '12px'
                    }}>CSV File Structure</h3>
                    <div style={{
                      overflowX: 'auto',
                      border: '1px solid #e1e5e9',
                      borderRadius: '6px'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '12px'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{
                              padding: '8px 12px',
                              textAlign: 'left',
                              borderBottom: '1px solid #e1e5e9',
                              fontWeight: '600'
                            }}>Field Header</th>
                            <th style={{
                              padding: '8px 12px',
                              textAlign: 'left',
                              borderBottom: '1px solid #e1e5e9',
                              fontWeight: '600'
                            }}>Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>EmailID*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Valid Email Address</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>LoginPassword*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Password</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>FirstName*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>First Name</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>LastName*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Last Name</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>ContactNo*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Phone Number (10 digits only)</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>IsCompany*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>If this is an admin account of B2B user, then 1 else 0</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>CompanyID*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>In case IsCompany is 0, then provide the ID of the parent B2B account</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>PlanStartDate*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>A valid date, today or future, in dd/mm/yyyy format</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>PlanExpiryDate*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>A valid date, today or future, in dd/mm/yyyy format</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>AccountStatus*</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Set this to 1 if you want this account to be active, else set 0</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Address</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Optional field</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>City</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Optional field. Use Id of the City, eg for New Delhi, the ID is 707</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>State</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Optional field. Use Id of the State, eg for Delhi, the ID is 10</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Country</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Optional field. Use Id of the Country, eg for India, the ID is 101</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>branchs</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Optional field. Use Id of the Branch, eg for Savista Noida branch, the ID is 515</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>departments</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Optional field. Use Id of the Department, eg for Sales - Voltas, the ID is 286</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>roles</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e1e5e9' }}>Optional field. Use Id of the Role, eg for Solution Architect, the ID is 162</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Download Template */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#0369a1' }}>Download CSV Template</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#0369a1' }}>
                          Download a sample CSV file with the correct structure and example data
                        </p>
                      </div>
                      <a
                        href="/bulk-user-upload-template.csv"
                        download="bulk-user-upload-template.csv"
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Download Template
                      </a>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      marginBottom: '8px'
                    }}>
                      Select CSV File
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        style={{
                          padding: '8px',
                          border: '1px solid #e1e5e9',
              borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {selectedFile ? selectedFile.name : 'No file chosen'}
                      </span>
            </div>
                  </div>

                  {/* Upload Results */}
                  {uploadResults && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: uploadResults.errorCount > 0 ? '#fef2f2' : '#f0fdf4',
                      borderRadius: '8px',
                      border: `1px solid ${uploadResults.errorCount > 0 ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: uploadResults.errorCount > 0 ? '#dc2626' : '#16a34a'
                      }}>
                        Upload Results
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                        ✅ Successfully created: {uploadResults.successCount} users
                      </p>
                      {uploadResults.errorCount > 0 && (
                        <p style={{ margin: '0', fontSize: '14px', color: '#dc2626' }}>
                          ❌ Errors: {uploadResults.errorCount} users
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e1e5e9'
                }}>
                  <button
                    onClick={() => {
                      setShowBulkUploadModal(false)
                      setSelectedFile(null)
                      setUploadResults(null)
                    }}
                    disabled={isUploading}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.6 : 1
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={isUploading || !selectedFile}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: (isUploading || !selectedFile) ? 'not-allowed' : 'pointer',
                      opacity: (isUploading || !selectedFile) ? 0.6 : 1
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload CSV File'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            overflowX: 'auto',
            overflowY: 'hidden'
          }}>
            <table style={{
              width: '100%',
              minWidth: '2000px', // Ensure table has minimum width for many columns
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  {columnVisibility.id && (
                    <th 
                      onClick={() => handleColumnClick('id')}
                      style={getHeaderStyle('id')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'id') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'id') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >ID</th>
                  )}
                  {columnVisibility.email && (
                    <th 
                      onClick={() => handleColumnClick('email')}
                      style={getHeaderStyle('email')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'email') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'email') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Email Address</th>
                  )}
                  {columnVisibility.firstName && (
                    <th 
                      onClick={() => handleColumnClick('firstName')}
                      style={getHeaderStyle('firstName')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'firstName') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'firstName') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >First Name</th>
                  )}
                  {columnVisibility.lastName && (
                    <th 
                      onClick={() => handleColumnClick('lastName')}
                      style={getHeaderStyle('lastName')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'lastName') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'lastName') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Last Name</th>
                  )}
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
                  {columnVisibility.phone && (
                    <th 
                      onClick={() => handleColumnClick('phone')}
                      style={getHeaderStyle('phone')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'phone') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'phone') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Phone</th>
                  )}
                  {columnVisibility.role && (
                    <th 
                      onClick={() => handleColumnClick('role')}
                      style={getHeaderStyle('role')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'role') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'role') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Role</th>
                  )}
                  {columnVisibility.accountName && (
                    <th 
                      onClick={() => handleColumnClick('accountName')}
                      style={getHeaderStyle('accountName')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'accountName') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'accountName') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Account Name</th>
                  )}
                  {columnVisibility.companyName && (
                    <th 
                      onClick={() => handleColumnClick('companyName')}
                      style={getHeaderStyle('companyName')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'companyName') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'companyName') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Company Name</th>
                  )}
                  {columnVisibility.businessCode && (
                    <th 
                      onClick={() => handleColumnClick('businessCode')}
                      style={getHeaderStyle('businessCode')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'businessCode') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'businessCode') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Business Code</th>
                  )}
                  {columnVisibility.region && (
                    <th 
                      onClick={() => handleColumnClick('region')}
                      style={getHeaderStyle('region')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'region') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'region') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Region</th>
                  )}
                  {columnVisibility.createdAt && (
                    <th 
                      onClick={() => handleColumnClick('createdAt')}
                      style={getHeaderStyle('createdAt')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'createdAt') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'createdAt') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Created At</th>
                  )}
                  {columnVisibility.updatedAt && (
                    <th 
                      onClick={() => handleColumnClick('updatedAt')}
                      style={getHeaderStyle('updatedAt')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'updatedAt') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'updatedAt') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Updated At</th>
                  )}
                  {columnVisibility.lastLoginAt && (
                    <th 
                      onClick={() => handleColumnClick('lastLoginAt')}
                      style={getHeaderStyle('lastLoginAt')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'lastLoginAt') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'lastLoginAt') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Last Login</th>
                  )}
                  {columnVisibility.planExpiryDate && (
                    <th 
                      onClick={() => handleColumnClick('planExpiryDate')}
                      style={getHeaderStyle('planExpiryDate')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'planExpiryDate') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'planExpiryDate') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Plan Expiry Date</th>
                  )}
                  {columnVisibility.tempPassword && (
                    <th 
                      onClick={() => handleColumnClick('tempPassword')}
                      style={getHeaderStyle('tempPassword')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'tempPassword') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'tempPassword') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Temporary Password</th>
                  )}
                  {columnVisibility.isActive && (
                    <th 
                      onClick={() => handleColumnClick('isActive')}
                      style={getHeaderStyle('isActive')}
                      onMouseEnter={(e) => {
                        if (selectedColumn !== 'isActive') {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedColumn !== 'isActive') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >Is Account Active?</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={Object.keys(columnVisibility).filter(key => columnVisibility[key as keyof typeof columnVisibility]).length} style={{ textAlign: 'center', padding: '40px' }}>
                      Loading B2B admin users...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={Object.keys(columnVisibility).filter(key => columnVisibility[key as keyof typeof columnVisibility]).length} style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                      Error: {error}
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={Object.keys(columnVisibility).filter(key => columnVisibility[key as keyof typeof columnVisibility]).length} style={{ textAlign: 'center', padding: '40px' }}>
                      No B2B admin users found
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user, index) => (
                  <tr key={user.id} style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' 
                  }}>
                    {columnVisibility.id && (
                      <td style={getCellStyle()}>
                        <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                  <span>{user.id}</span>
                  <button style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>EDIT</button>
                        </div>
                </td>
                    )}
                    {columnVisibility.email && (
                      <td style={getCellStyle()}>{user.email}</td>
                    )}
                    {columnVisibility.firstName && (
                      <td style={getCellStyle()}>{user.firstName}</td>
                    )}
                    {columnVisibility.lastName && (
                      <td style={getCellStyle()}>{user.lastName}</td>
                    )}
                    {columnVisibility.userName && (
                      <td style={getCellStyle()}>{user.userName}</td>
                    )}
                    {columnVisibility.phone && (
                      <td style={getCellStyle()}>{user.phone}</td>
                    )}
                    {columnVisibility.role && (
                      <td style={getCellStyle()}>{user.role}</td>
                    )}
                      {columnVisibility.accountName && (
                        <td style={getCellStyle()}>{user.accountName || 'N/A'}</td>
                    )}
                    {columnVisibility.companyName && (
                        <td style={getCellStyle()}>{user.companyName || 'N/A'}</td>
                      )}
                      {columnVisibility.businessCode && (
                        <td style={getCellStyle()}>{user.businessCode || 'N/A'}</td>
                      )}
                      {columnVisibility.region && (
                        <td style={getCellStyle()}>{user.region || 'N/A'}</td>
                      )}
                      {columnVisibility.createdAt && (
                        <td style={getCellStyle()}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      )}
                      {columnVisibility.updatedAt && (
                        <td style={getCellStyle()}>{new Date(user.updatedAt).toLocaleDateString()}</td>
                      )}
                      {columnVisibility.lastLoginAt && (
                        <td style={getCellStyle()}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                    )}
                    {columnVisibility.planExpiryDate && (
                        <td style={getCellStyle()}>{user.planExpiryDate ? new Date(user.planExpiryDate).toLocaleDateString() : 'N/A'}</td>
                      )}
                      {columnVisibility.tempPassword && (
                        <td style={getCellStyle()}>
                          {user.tempPassword ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{
                                fontFamily: 'monospace',
                                backgroundColor: '#f3f4f6',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                border: '1px solid #d1d5db'
                              }}>
                                {user.tempPassword}
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: '#ef4444',
                                fontWeight: '500'
                              }}>
                                (Temp)
                              </span>
                            </div>
                          ) : (
                            <span style={{
                              fontSize: '12px',
                              color: '#10b981',
                              fontWeight: '500'
                            }}>
                              Password Changed
                            </span>
                          )}
                        </td>
                    )}
                    {columnVisibility.isActive && (
                <td style={{
                        ...getCellStyle(),
                    textAlign: 'center'
                }}>{user.isActive ? '✓' : '✗'}</td>
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
                  {selectedColumn === 'id' ? 'ID' :
                   selectedColumn === 'email' ? 'Email Address' :
                   selectedColumn === 'firstName' ? 'First Name' :
                   selectedColumn === 'lastName' ? 'Last Name' :
                   selectedColumn === 'userName' ? 'User Name' :
                   selectedColumn === 'phone' ? 'Phone' :
                   selectedColumn === 'role' ? 'Role' :
                   selectedColumn === 'accountName' ? 'Account Name' :
                   selectedColumn === 'companyName' ? 'Company Name' :
                   selectedColumn === 'businessCode' ? 'Business Code' :
                   selectedColumn === 'region' ? 'Region' :
                   selectedColumn === 'createdAt' ? 'Created At' :
                   selectedColumn === 'updatedAt' ? 'Updated At' :
                   selectedColumn === 'lastLoginAt' ? 'Last Login' :
                   selectedColumn === 'planExpiryDate' ? 'Plan Expiry Date' :
                   selectedColumn === 'tempPassword' ? 'Temporary Password' :
                   selectedColumn === 'isActive' ? 'Is Account Active' :
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
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                style={{
                marginLeft: '8px',
                padding: '4px 8px',
                border: '1px solid #e1e5e9',
                borderRadius: '4px'
              }}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrev}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e1e5e9',
                  backgroundColor: !pagination.hasPrev ? '#f9fafb' : '#ffffff',
                  color: !pagination.hasPrev ? '#9ca3af' : '#374151',
                  borderRadius: '4px',
                  cursor: !pagination.hasPrev ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Previous
              </button>
              <span style={{
                padding: '8px 12px',
                fontSize: '14px',
                color: '#374151'
              }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={!pagination.hasNext}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e1e5e9',
                  backgroundColor: !pagination.hasNext ? '#f9fafb' : '#ffffff',
                  color: !pagination.hasNext ? '#9ca3af' : '#374151',
                  borderRadius: '4px',
                  cursor: !pagination.hasNext ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next
              </button>
                        </div>
          </div>
        </div>
      </main>
    </div>
  )
}
