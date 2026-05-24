'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

interface Branch {
  branchId: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  createdOn: string;
  businessCode?: string;
  businessCategory?: string;
  region?: string;
  zone?: string;
  batch?: string;
  branch?: string;
  assignedEmployeesCount?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiResponse {
  success: boolean;
  data: {
    branches: Branch[];
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

export default function ManageBranchesPage() {
  const [nameFilter, setNameFilter] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  // Create branch modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccount[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    corporateAccountId: '',
    branchName: '',
    businessCode: '',
    businessCategory: '',
    region: '',
    zone: '',
    batch: ''
  })

  // Fetch branches from API
  const fetchBranches = async (page: number = 1, name: string = '') => {
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
      
      const response = await fetch(`/api/super-admin/manage-branches?${params}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setBranches(data.data.branches)
        setCurrentPage(data.data.pagination.currentPage)
        setTotalPages(data.data.pagination.totalPages)
        setTotalCount(data.data.pagination.totalCount)
      } else {
        setError(data.error || 'Failed to fetch branches')
      }
    } catch (err) {
      setError('Failed to fetch branches')
      console.error('Error fetching branches:', err)
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

  // Handle create branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)

    try {
      const response = await fetch('/api/super-admin/manage-branches', {
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
          branchName: '',
          businessCode: '',
          businessCategory: '',
          region: '',
          zone: '',
          batch: ''
        })
        fetchBranches(currentPage, nameFilter)
        alert('Branch created successfully!')
      } else {
        setCreateError(data.error || 'Failed to create branch')
      }
    } catch (err) {
      setCreateError('Failed to create branch')
      console.error('Error creating branch:', err)
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
      fetchBranches(1, nameFilter)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [nameFilter])

  // Filter branches based on name filter (client-side filtering for immediate response)
  const filteredBranches = branches.filter(branch =>
    branch.branchName.toLowerCase().includes(nameFilter.toLowerCase()) ||
    branch.address.toLowerCase().includes(nameFilter.toLowerCase()) ||
    branch.city.toLowerCase().includes(nameFilter.toLowerCase()) ||
    branch.state.toLowerCase().includes(nameFilter.toLowerCase()) ||
    branch.country.toLowerCase().includes(nameFilter.toLowerCase())
  )

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar activeItem="manage-branches" title="Admin Panel" />

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
          }}>Manage Branches</h1>

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
              <div style={{ fontSize: '16px', color: '#666' }}>Loading branches...</div>
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
                onClick={() => fetchBranches(1, nameFilter)}
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
                placeholder="Filter by name"
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

          {/* Create Branch Modal */}
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
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#1a1a1a'
                }}>Create New Branch</h2>

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

                <form onSubmit={handleCreateBranch}>
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

                  {/* Branch Name */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      placeholder="e.g., Main Branch, North Branch"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Business Code */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Business Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessCode}
                      onChange={(e) => setFormData({ ...formData, businessCode: e.target.value })}
                      placeholder="e.g., BR001, NORTH_01"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Business Category */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Business Category *
                    </label>
                    <select
                      required
                      value={formData.businessCategory}
                      onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Category</option>
                      <option value="Banking">Banking</option>
                      <option value="Customer Service">Customer Service</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                      <option value="IT">IT</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Region */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Region *
                    </label>
                    <select
                      required
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Region</option>
                      <option value="NORTH">NORTH</option>
                      <option value="SOUTH">SOUTH</option>
                      <option value="EAST">EAST</option>
                      <option value="WEST">WEST</option>
                      <option value="CENTRAL">CENTRAL</option>
                      <option value="NORTHEAST">NORTHEAST</option>
                    </select>
                  </div>

                  {/* Zone */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Zone
                    </label>
                    <input
                      type="text"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      placeholder="e.g., NORTH ZONE, SOUTH ZONE"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Batch */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      Batch
                    </label>
                    <input
                      type="text"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      placeholder="e.g., 2025, Q1-2025"
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
                      {creating ? 'Creating...' : 'Create Branch'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Branches Table */}
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
                  }}>Branch ID</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Branch Name</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Address</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>City</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>State</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Country</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Created on</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch, index) => (
                  <tr key={branch.branchId} style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' 
                  }}>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333',
                      fontWeight: '500'
                    }}>{branch.branchId}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{branch.branchName}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{branch.address || '-'}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{branch.city || '-'}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{branch.state || '-'}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{branch.country || '-'}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{branch.createdOn}</td>
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
              Showing {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''}
              {nameFilter && ` matching "${nameFilter}"`}
              {totalCount > 0 && (
                <span style={{ marginLeft: '10px', color: '#999' }}>
                  (Total: {totalCount} branches)
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
