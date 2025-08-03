import React, { useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../services/auth';
import { overlayService } from '../services/supabase';
import { OverlayData } from '../types';
import LoadMapModal from './LoadMapModal';
import ConfirmModal from './ConfirmModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onSignOut: () => void;
  onSignIn: () => void;
  onMapSelect: (map: OverlayData) => void;
  onMapEdit: (map: OverlayData) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user, onSignOut, onSignIn, onMapSelect, onMapEdit }) => {
  const [isMyMapsExpanded, setIsMyMapsExpanded] = useState(false);
  const [userMaps, setUserMaps] = useState<OverlayData[]>([]);
  const [isLoadMapModalOpen, setIsLoadMapModalOpen] = useState(false);
  const [isLoadingMaps, setIsLoadingMaps] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<OverlayData | null>(null);

  const loadUserMaps = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingMaps(true);
    try {
      const maps = await overlayService.getUserOverlays(user.id);
      setUserMaps(maps);
    } catch (error) {
      console.error('Error loading user maps:', error);
    } finally {
      setIsLoadingMaps(false);
    }
  }, [user]);

  // Cargar mapas del usuario cuando se abre la sidebar y hay un usuario autenticado
  useEffect(() => {
    if (isOpen && user) {
      loadUserMaps();
    }
  }, [isOpen, user, loadUserMaps]);

  const handleMapLoaded = () => {
    loadUserMaps(); // Recargar la lista de mapas
  };

  const handleMapEdit = (map: OverlayData) => {
    // Activar modo de edición visual en lugar de abrir modal directamente
    onMapEdit(map);
  };

  const handleMapDelete = (map: OverlayData) => {
    if (!user) return;
    
    setMapToDelete(map);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!mapToDelete || !user) return;
    
    try {
      await overlayService.deleteOverlay(mapToDelete.id);
      // Recargar la lista de mapas después de eliminar
      loadUserMaps();
    } catch (error) {
      console.error('Error deleting map:', error);
      alert('Error al eliminar el mapa. Por favor, inténtalo de nuevo.');
    }
  };

  // Esta función ya no es necesaria aquí, se maneja en App.tsx

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
            {/* My Maps Section */}
            <div>
              <button
                onClick={() => setIsMyMapsExpanded(!isMyMapsExpanded)}
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
                  justifyContent: 'space-between',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>🗺️</span>
                  My Maps
                </div>
                <span style={{
                  transform: isMyMapsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  fontSize: '12px'
                }}>
                  ▼
                </span>
              </button>
              
              {/* Dropdown Content */}
              {isMyMapsExpanded && (
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {/* Load Map Button */}
                  <button
                    onClick={() => setIsLoadMapModalOpen(true)}
                    style={{
                      width: '100%',
                      padding: '8px 24px 8px 48px',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.8)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>📁</span>
                    Load Map
                  </button>
                  
                  {/* User Maps List */}
                  {isLoadingMaps ? (
                    <div style={{
                      padding: '8px 24px 8px 48px',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '12px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Cargando mapas...
                    </div>
                  ) : userMaps.length > 0 ? (
                    userMaps.map((map) => (
                      <div
                        key={map.id}
                        style={{
                          padding: '8px 24px 8px 48px',
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '13px',
                          fontFamily: 'Inter, sans-serif',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background-color 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div
                          style={{
                            cursor: 'pointer',
                            flex: 1,
                            textAlign: 'left'
                          }}
                          onClick={() => {
                            onMapSelect(map);
                            onClose(); // Cerrar sidebar después de seleccionar
                          }}
                        >
                          📄 {map.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMapEdit(map);
                            }}
                            style={{
                              background: 'rgba(58, 95, 118, 0.8)',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              color: 'white',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(58, 95, 118, 1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(58, 95, 118, 0.8)';
                            }}
                            title="Editar mapa"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMapDelete(map);
                            }}
                            style={{
                              background: 'rgba(231, 76, 60, 0.8)',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              color: 'white',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.8)';
                            }}
                            title="Eliminar mapa"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '8px 24px 8px 48px',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '12px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      No hay mapas cargados
                    </div>
                  )}
                </div>
              )}
            </div>
            
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

      {/* Load Map Modal */}
      <LoadMapModal
        isOpen={isLoadMapModalOpen}
        onClose={() => setIsLoadMapModalOpen(false)}
        user={user}
        onMapLoaded={handleMapLoaded}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setMapToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar mapa"
        message={`¿Estás seguro de que quieres eliminar el mapa "${mapToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

    </>
  );
};

export default Sidebar; 