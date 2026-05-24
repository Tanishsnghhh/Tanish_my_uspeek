'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

interface Role {
  id: string;
  roleId: string;
  role: string;
  code: string;
  type: string;
  count: number;
  createDate: string;
  updatedDate: string;
  rawCreateDate?: string;
}

interface RolesResponse {
  success: boolean;
  roles: Role[];
  totalRoles: number;
  stats: {
    totalJobTitles: number;
    totalSystemRoles: number;
    totalEmployeesWithJobTitles: number;
    totalUsersWithRoles: number;
  };
}

export default function ManageRolesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [nameFilter, setNameFilter] = useState('')
  const [rolesData, setRolesData] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createRoleLoading, setCreateRoleLoading] = useState(false)

  // Fetch roles data from API
  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/super-admin/manage-roles')
      const data: RolesResponse = await response.json()
      
      if (data.success) {
        setRolesData(data.roles)
      } else {
        setError('Failed to fetch roles data')
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
      setError('Error loading roles data')
    } finally {
      setLoading(false)
    }
  }

  const createRole = async (roleData: { role: string; code: string; type: string }) => {
    try {
      setCreateRoleLoading(true)
      const response = await fetch('/api/super-admin/manage-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh the roles list
        await fetchRoles()
        setShowCreateModal(false)
        alert('Role created successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      console.error('Error creating role:', err)
      alert('Error creating role')
    } finally {
      setCreateRoleLoading(false)
    }
  }

  // Filter roles based on search criteria
  const filteredRoles = rolesData.filter(role => {
    return !nameFilter || role.role.toLowerCase().includes(nameFilter.toLowerCase())
  })
  
  const totalRecords = filteredRoles.length

  const totalFilteredRecords = filteredRoles.length
  const totalPages = Math.ceil(totalFilteredRecords / rowsPerPage)

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalFilteredRecords)

  // Get current page roles from filtered data
  const currentRoles = filteredRoles.slice(startIndex, endIndex)

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (currentPage <= 3) {
      // Show first pages
      for (let i = 1; i <= Math.min(5, totalPages); i++) {
        pageNumbers.push(i)
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last pages
      for (let i = Math.max(totalPages - 4, 1); i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Show middle pages
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pageNumbers.push(i)
      }
    }
    
    return pageNumbers.map((number) => (
      <button
        key={number}
        onClick={() => setCurrentPage(number)}
        style={{
          padding: '8px 12px',
          margin: '0 2px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: number === currentPage ? '#1976d2' : '#ffffff',
          color: number === currentPage ? 'white' : '#333',
          cursor: 'pointer',
          fontSize: '14px',
          minWidth: '36px',
          textAlign: 'center',
        }}
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
      <Sidebar activeItem="manage-roles" title="Admin Panel" />

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
            }}>Manage Roles</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              Create Role
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ fontSize: '16px', color: '#666' }}>Loading roles data...</div>
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
              display: 'flex',
              gap: '20px',
              marginBottom: '30px',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Filter by role name"
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
            </div>
          )}

          {/* Roles Table */}
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
                  }}>Role</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Type</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Count</th>
                  <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                    color: '#1a1a1a'
                  }}>Create Date</th>
                </tr>
              </thead>
              <tbody>
                {currentRoles.map((role, index) => (
                  <tr 
                    key={`${role.roleId}-${index}`} 
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                    }}
                  >
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>{role.role}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: role.type === 'Job Title' ? '#e3f2fd' : '#fff3e0',
                        color: role.type === 'Job Title' ? '#1976d2' : '#f57c00'
                      }}>
                        {role.type}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#333333',
                      fontWeight: '500'
                    }}>{role.count}</td>
                    <td style={{
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      color: '#666'
                    }}>{role.createDate}</td>
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
              {startIndex + 1}-{Math.min(endIndex, totalFilteredRecords)} of {totalFilteredRecords}
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

          {/* Create Role Modal */}
          {showCreateModal && (
            <CreateRoleModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreateRole={createRole}
              loading={createRoleLoading}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// Create Role Modal Component
interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (roleData: { role: string; code: string; type: string }) => void;
  loading: boolean;
}

function CreateRoleModal({ isOpen, onClose, onCreateRole, loading }: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    role: '',
    code: '',
    type: 'Job Title'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.role.trim()) {
      newErrors.role = 'Role name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Role code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onCreateRole(formData);
    }
  };

  const handleClose = () => {
    setFormData({ role: '', code: '', type: 'Job Title' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
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
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>Create New Role</h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Role Name *
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Senior Manager"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.role ? '#e74c3c' : '#e1e5e9'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {errors.role && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>
                {errors.role}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Role Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., SM-001"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.code ? '#e74c3c' : '#e1e5e9'}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {errors.code && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>
                {errors.code}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Role Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="Job Title">Job Title</option>
              <option value="System Role">System Role</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: loading ? '#ccc' : '#1976d2',
                color: 'white',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
