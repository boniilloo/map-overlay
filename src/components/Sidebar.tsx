import React from 'react';
import { AuthUser } from '../services/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onSignOut: () => void;
  onSignIn: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user, onSignOut, onSignIn }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-300px',
        width: '300px',
        height: '100vh',
        backgroundColor: '#3A5F76',
        boxShadow: isOpen ? '2px 0 10px rgba(0,0,0,0.3)' : 'none',
        transition: 'left 0.3s ease',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <img
              src="/logo.png"
              alt="Map Overlay Logo"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
            <h2 style={{
              margin: 0,
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Map Overlay
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {user.name || 'User'}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div style={{
          flex: 1,
          padding: '16px 0'
        }}>
          <div style={{
            padding: '12px 24px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Menu
          </div>
          
          <div style={{
            padding: '8px 0'
          }}>
            <button
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>🗺️</span>
              My Maps
            </button>
            
            <button
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>⚙️</span>
              Settings
            </button>
            
            <button
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>❓</span>
              Help
            </button>
          </div>
        </div>

        {/* Sign In Section (if not authenticated) */}
        {!user && (
          <div style={{
            padding: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: 'auto'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                Sign in to save your maps and preferences
              </div>
              <button
                onClick={onSignIn}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#E74C3C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C53030';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E74C3C';
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        {user && (
          <div style={{
            padding: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={onSignOut}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.8)';
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar; 