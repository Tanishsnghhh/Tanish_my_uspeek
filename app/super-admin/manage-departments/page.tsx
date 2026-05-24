'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

interface Department {
  departmentId: string;
  name: string;
  code: string;
  companyName: string;
  city: string;
  state: string;
  country: string;
  region: string;
  location: string;
  corporate_account_id: string | null;
  employeeCount: number;
  assignedEmployees: string[]; // Array of employee IDs
  status: string;
  createdOn: string;
  updatedOn: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    departments: Department[];
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

interface CorporateAccount {
  _id: string;
  companyName: string;
  city: string;
  state: string;
  country: string;
}

export default function ManageDepartmentsPage() {
  const [nameFilter, setNameFilter] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  // Create department modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccount[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    corporateAccountId: '',
    departmentName: ''
  })

  // Fetch departments from API
  const fetchDepartments = async (page: number = 1, name: string = '') => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      
      if (name) {
        params.append('name', name)
      }
      
      const response = await fetch(`/api/super-admin/manage-departments?${params}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setDepartments(data.data.departments)
        setCurrentPage(data.data.pagination.currentPage)
        setTotalPages(data.data.pagination.totalPages)
        setTotalCount(data.data.pagination.totalCount)
      } else {
        setError(data.error || 'Failed to fetch departments')
      }
    } catch (err) {
      setError('Failed to fetch departments')
      console.error('Error fetching departments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch corporate accounts for the dropdown
  const fetchCorporateAccounts = async () => {
    try {
      const response = await fetch('/api/corporate-accounts')
      const data = await response.json()
      if (data.success) {
        setCorporateAccounts(data.data)
      }
    } catch (err) {
      console.error('Error fetching corporate accounts:', err)
    }
  }

  // Handle create department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)

    try {
      const response = await fetch('/api/super-admin/manage-departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Success - close modal and refresh list
        setShowCreateModal(false)
        setFormData({
          corporateAccountId: '',
          departmentName: ''
        })
        fetchDepartments(currentPage, nameFilter)
        alert('Department created successfully!')
    } else {
        setCreateError(data.error || 'Failed to create department')
      }
    } catch (err) {
      setCreateError('Failed to create department')
      console.error('Error creating department:', err)
    } finally {
      setCreating(false)
    }
  }

  // Open create modal
  const openCreateModal = () => {
    fetchCorporateAccounts()
    setShowCreateModal(true)
    setCreateError(null)
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDepartments(1, nameFilter)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [nameFilter])

  // Filter departments based on name filter (client-side filtering for immediate response)
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
    dept.companyName.toLowerCase().includes(nameFilter.toLowerCase())
  )

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="manage-departments" title="Admin Panel" />

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
          }}>Manage Departments</h1>

          {/* Loading State */}
          {loading && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              <div style={{ fontSize: '16px', color: '#666' }}>Loading departments...</div>
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
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              <div style={{ fontSize: '16px', color: '#dc3545', marginBottom: '20px' }}>Error: {error}</div>
              <button
                onClick={() => fetchDepartments(1, nameFilter)}
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

          {/* Filter and Action Section */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '30px',
            alignItems: 'center'
          }}>
            {/* Filter Input */}
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Filter by department name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
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

            {/* Create Button */}
            <button
              onClick={openCreateModal}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1565c0'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#1976d2'
              }}
            >
              + CREATE
            </button>
          </div>

          {/* Create Department Modal */}
          {showCreateModal && (
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
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#1a1a1a'
                }}>Create New Department</h2>

                {createError && (
                  <div style={{
                    backgroundColor: '#fee',
                    color: '#c33',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}>
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreateDepartment}>
                  {/* Corporate Account Selection */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Corporate Account *
                    </label>
                    <select
                      required
                      value={formData.corporateAccountId}
                      onChange={(e) => setFormData({ ...formData, corporateAccountId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Corporate Account</option>
                      {corporateAccounts.map(account => (
                        <option key={account._id} value={account._id}>
                          {account.companyName} - {account.city}, {account.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Name */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Department Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.departmentName}
                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                      placeholder="e.g., Sales, Marketing, IT"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>


                  {/* Form Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    marginTop: '30px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      disabled={creating}
                      style={{
                        padding: '10px 20px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: creating ? 'not-allowed' : 'pointer',
                        backgroundColor: 'white',
                        color: '#666'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: creating ? 'not-allowed' : 'pointer',
                        backgroundColor: creating ? '#ccc' : '#1976d2',
                        color: 'white'
                      }}
                    >
                      {creating ? 'Creating...' : 'Create Department'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Departments Table */}
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
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                    }}>Department Name</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                    }}>Company</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                    }}>Employees</th>
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
                    }}>Created On</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                    }}>Updated On</th>
                </tr>
              </thead>
              <tbody>
                  {filteredDepartments.map((dept, index) => (
                    <tr key={dept.departmentId} style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' 
                  }}>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333',
                      fontWeight: '500'
                      }}>{dept.name}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                      }}>{dept.companyName}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                      }}>{dept.employeeCount}</td>
                    <td style={{
                      padding: '16px',
                        borderBottom: '1px solid #e1e5e9'
                    }}>
                      <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: dept.status === 'active' ? '#d4edda' : '#f8d7da',
                          color: dept.status === 'active' ? '#155724' : '#721c24'
                        }}>
                          {dept.status}
                        </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                      }}>{dept.createdOn}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                        color: '#333333'
                      }}>{dept.updatedOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Results Count */}
          {!loading && !error && (
          <div style={{
            marginTop: '20px',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center'
            }}>
              Showing {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''}
              {nameFilter && ` matching "${nameFilter}"`}
              {totalCount > 0 && (
                <span style={{ marginLeft: '10px', color: '#999' }}>
                  (Total: {totalCount} departments)
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}