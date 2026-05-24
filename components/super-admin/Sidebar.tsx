'use client'

import React from 'react'
import { LogOut } from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  icon: string
  active: boolean
}

interface SidebarProps {
  activeItem: string
  title: string
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⚏', active: false },
  { id: 'b2b-admin-users', label: 'B2B Admin Users', icon: '👥', active: false },
  { id: 'videos', label: 'Videos', icon: '📹', active: false },
  { id: 'user-activity-log', label: 'User Activity Log', icon: '👥', active: false },
  { id: 'manage-branches', label: 'Manage Branches', icon: '☰', active: false },
  { id: 'manage-departments', label: 'Manage Departments', icon: '☰', active: false },
  { id: 'manage-roles', label: 'Manage Roles', icon: '☰', active: false },
  { id: 'manage-admin-users', label: 'Manage Admin Users', icon: '☰', active: false },
  { id: 'cities', label: 'Cities', icon: '☰', active: false },
  { id: 'states', label: 'States', icon: '☰', active: false },
  { id: 'countries', label: 'Countries', icon: '☰', active: false },
  { id: 'b2c-users', label: 'B2C Users', icon: '👤', active: false },
  { id: 'all-users', label: 'All Users', icon: '👤', active: false }
]

export default function Sidebar({ activeItem, title }: SidebarProps) {
  const logout = async () => {
    console.log('Logout function called');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('uspeak_token');
      
      // Call logout API to log the action
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Failed to log logout action:', error);
      // Continue with logout even if API call fails
    }
    
    // Clear all authentication data
    localStorage.removeItem('uspeak_token');
    localStorage.removeItem('uspeak_user');
    localStorage.removeItem('uspeak_role');
    
    console.log('LocalStorage cleared');
    
    console.log('State cleared, redirecting to /auth');
    
    // Force redirect to login page using full page navigation
    window.location.href = '/auth';
  };

  const handleMenuClick = (itemId: string) => {
    // Navigate to the selected page
    if (itemId === 'dashboard') {
      window.location.href = '/super-admin/dashboard'
    } else if (itemId === 'b2b-admin-users') {
      window.location.href = '/super-admin/b2b-admin-users'
    } else if (itemId === 'videos') {
      window.location.href = '/super-admin/videos'
    } else if (itemId === 'user-activity-log') {
      window.location.href = '/super-admin/user-activity-log'
    } else if (itemId === 'manage-branches') {
      window.location.href = '/super-admin/manage-branches'
    } else if (itemId === 'manage-departments') {
      window.location.href = '/super-admin/manage-departments'
    } else if (itemId === 'manage-roles') {
      window.location.href = '/super-admin/manage-roles'
    } else if (itemId === 'manage-admin-users') {
      window.location.href = '/super-admin/manage-admin-users'
    } else if (itemId === 'cities') {
      window.location.href = '/super-admin/cities'
    } else if (itemId === 'states') {
      window.location.href = '/super-admin/states'
    } else if (itemId === 'countries') {
      window.location.href = '/super-admin/countries'
    } else if (itemId === 'b2c-users') {
      window.location.href = '/super-admin/b2c-users'
    } else if (itemId === 'all-users') {
      window.location.href = '/super-admin/all-users'
    }
  }

  return (
    <aside style={{
      width: '280px',
      backgroundColor: '#2f3349',
      color: 'white',
      flexShrink: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '24px 20px',
        backgroundColor: '#2f3349',
        borderBottom: '1px solid #44475a'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#ffffff',
          margin: 0
        }}>{title}</h2>
      </div>
      
      <nav style={{
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflowY: 'auto'
      }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '14px 24px',
              backgroundColor: item.id === activeItem ? '#4a69db' : '#2f3349',
              border: 'none',
              color: item.id === activeItem ? '#ffffff' : '#b0b0b0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              fontSize: '16px',
              fontWeight: item.id === activeItem ? '500' : '400',
              position: 'relative',
              borderLeft: item.id === activeItem ? '4px solid #64b5f6' : '4px solid transparent'
            }}
            onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (item.id !== activeItem) {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = '#3c3f51'
                target.style.color = '#ffffff'
              }
            }}
            onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (item.id !== activeItem) {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = '#2f3349'
                target.style.color = '#b0b0b0'
              }
            }}
          >
            <span style={{
              fontSize: '18px',
              marginRight: '16px',
              width: '24px',
              textAlign: 'center'
            }}>{item.icon}</span>
            <span style={{
              fontSize: '15px',
              fontWeight: '400',
              lineHeight: '1.4'
            }}>{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Logout Section - Fixed at bottom */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #44475a',
        backgroundColor: '#2f3349',
        marginTop: 'auto'
      }}>
        <button
          onClick={logout}
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 24px',
            backgroundColor: '#dc3545',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left',
            fontSize: '16px',
            fontWeight: '500',
            borderRadius: '6px',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
            const target = e.target as HTMLButtonElement
            target.style.backgroundColor = '#c82333'
          }}
          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
            const target = e.target as HTMLButtonElement
            target.style.backgroundColor = '#dc3545'
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
