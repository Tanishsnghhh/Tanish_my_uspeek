'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/super-admin/Sidebar'

interface CityData {
  id: number;
  city: string;
  state: string;
  userCount: number;
}

interface CitiesResponse {
  success: boolean;
  data: CityData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export default function CitiesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [citiesData, setCitiesData] = useState<CityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  })

  // Fetch cities data from API
  const fetchCities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString(),
        ...(cityFilter && { city: cityFilter }),
        ...(stateFilter && { state: stateFilter })
      })

      const url = `/api/super-admin/cities?${params}`
      console.log('Fetching cities from:', url)
      
      const response = await fetch(url)
      const data: CitiesResponse = await response.json()

      console.log('API Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cities')
      }

      setCitiesData(data.data)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching cities')
      console.error('Error fetching cities:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchCities()
  }, [currentPage, rowsPerPage, cityFilter, stateFilter])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [cityFilter, stateFilter])

  const totalPages = pagination.totalPages
  const totalRecords = pagination.totalCount
  const currentCities = citiesData

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
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
        onClick={() => typeof number === 'number' && !loading && setCurrentPage(number)}
        style={{
          padding: '8px 12px',
          margin: '0 2px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: number === currentPage ? '#1976d2' : '#ffffff',
          color: number === currentPage ? 'white' : '#333',
          cursor: (typeof number === 'number' && !loading) ? 'pointer' : 'default',
          fontSize: '14px',
          minWidth: '36px',
          textAlign: 'center',
        }}
        disabled={typeof number !== 'number' || loading}
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
      <Sidebar activeItem="cities" title="Admin Panel" />

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
          }}>Cities</h1>

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
              }}>Filter by city name</label>
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Enter city name"
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
              }}>Filter by state name</label>
              <input
                type="text"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                placeholder="Enter state name"
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

          {/* Cities Table */}
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
              minWidth: '600px', // Ensure table has minimum width
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th 
                    style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderBottom: '1px solid #e1e5e9',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      cursor: 'pointer',
                      userSelect: 'none',
                      minWidth: '120px',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={handleSort}
                  >
                    ID {sortOrder === 'asc' ? '↑' : '↓'}
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    minWidth: '200px',
                    whiteSpace: 'nowrap'
                  }}>City</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e1e5e9',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    minWidth: '200px',
                    whiteSpace: 'nowrap'
                  }}>State</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '16px'
                    }}>
                      Loading cities data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={3} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#d32f2f',
                      fontSize: '16px'
                    }}>
                      Error: {error}
                    </td>
                  </tr>
                ) : currentCities.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '16px'
                    }}>
                      No cities found matching your criteria
                    </td>
                  </tr>
                ) : (
                  currentCities.map((city, index) => (
                    <tr key={`${city.id}-${index}`} style={{ 
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' 
                    }}>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333',
                        fontWeight: '500',
                        minWidth: '120px',
                        whiteSpace: 'nowrap'
                      }}>{city.id}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333',
                        minWidth: '200px',
                        whiteSpace: 'nowrap'
                      }}>{city.city}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        color: '#333333',
                        minWidth: '200px',
                        whiteSpace: 'nowrap'
                      }}>{city.state}</td>
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
        </div>
      </main>
    </div>
  )
}
