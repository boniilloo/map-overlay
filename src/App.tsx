import React, { useEffect, useState } from 'react';
import Map from './components/Map';
import { useLocation } from './hooks/useLocation';
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';
import EditMapModal from './components/EditMapModal';
import { authService, AuthUser } from './services/auth';
import { OverlayData } from './types';
import './App.css';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<OverlayData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMap, setEditingMap] = useState<OverlayData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    location,
    compass,
    isLoading: locationLoading,
    error: locationError,
    getCurrentLocation,
    startWatchingLocation,
    startCompass
  } = useLocation();

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 seconds timeout

    initAuth();

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      clearTimeout(timeoutId); // Clear timeout if auth state changes
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Start location tracking and compass
  useEffect(() => {
    const initLocation = async () => {
      await getCurrentLocation();
      await startWatchingLocation();
      startCompass();
    };

    initLocation();
  }, []); // Empty dependency array to run only once

  const handleRequestLocation = () => {
    getCurrentLocation();
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setUser(user);
    setIsLoginModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMapSelect = (map: OverlayData) => {
    setSelectedMap(map);
    setIsEditMode(false);
  };

  const handleMapEdit = (map: OverlayData) => {
    setSelectedMap(map);
    setEditingMap(map);
    setIsEditMode(true);
  };

  const handleClearMapSelection = () => {
    setSelectedMap(null);
    setIsEditMode(false);
    setEditingMap(null);
  };

  const handleEditComplete = (bounds: L.LatLngBounds) => {
    if (editingMap) {
      const anchorPoints = (window as any).currentAnchorPoints;
      const calculatedCenter = (window as any).currentCenterPosition;
      
      // Use calculated center position from anchor points for consistency
      const centerPosition = calculatedCenter || bounds.getCenter();
      
      const updatedMap = {
        ...editingMap,
        position: { lat: centerPosition.lat, lng: centerPosition.lng },
        anchorPoints: anchorPoints // Include anchor points
      };
      
      setEditingMap(updatedMap);
    }
  };

  // Listen for clear map selection event
  useEffect(() => {
    const handleClearEvent = () => {
      handleClearMapSelection();
    };

    const handleConfirmEditEvent = () => {
      setIsEditMode(false);
      // Open edit modal with calculated values
      if (editingMap) {
        setIsEditModalOpen(true);
      }
    };

    window.addEventListener('clearMapSelection', handleClearEvent);
    window.addEventListener('confirmMapEdit', handleConfirmEditEvent);
    
    return () => {
      window.removeEventListener('clearMapSelection', handleClearEvent);
      window.removeEventListener('confirmMapEdit', handleConfirmEditEvent);
    };
  }, [editingMap]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#3A5F76',
        color: 'white',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Loading Map Overlay...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
        {/* Main Map */}
        <Map 
          currentLocation={location} 
          selectedMap={selectedMap} 
          isEditMode={isEditMode}
          onEditComplete={handleEditComplete}
        />

      {/* Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          backgroundColor: '#3A5F76',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: '20px'
        }}
        title="Menu"
      >
        ☰
      </button>



      {/* Simple GPS Status */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(58, 95, 118, 0.9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: location ? '#27AE60' : locationError ? '#E74C3C' : '#95A5A6'
            }}
          />
          <span>
            {locationLoading ? 'Getting location...' : 
             locationError ? 'GPS Error' : 
             location ? 'GPS Active' : 'GPS Off'}
          </span>
        </div>
        {location && (
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </div>
        )}
        {locationError && (
          <button
            onClick={handleRequestLocation}
            style={{
              background: 'none',
              border: '1px solid #E74C3C',
              color: '#E74C3C',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              marginTop: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E74C3C';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#E74C3C';
            }}
          >
            🔄 Reintentar
          </button>
        )}
      </div>

      {/* Simple Compass */}
      {compass && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          backgroundColor: '#E74C3C',
          color: 'white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          fontSize: '18px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {Math.round(compass.heading)}°
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onSignOut={handleSignOut}
        onSignIn={() => setIsLoginModalOpen(true)}
        onMapSelect={handleMapSelect}
        onMapEdit={handleMapEdit}
      />

      {/* Edit Map Modal */}
      <EditMapModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMap(null);
        }}
        map={editingMap}
        onMapUpdated={() => {
          setIsEditModalOpen(false);
          setEditingMap(null);
          setSelectedMap(null);
        }}
      />
    </div>
  );
}

export default App; 