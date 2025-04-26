import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Emergency Admin View - Production Data Debugging
 * This is a simplified view that focuses entirely on data display with minimal styling
 * It uses direct DOM manipulation and multiple fetch methods to ensure data is displayed
 */

export default function EmergencyAdmin() {
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'info' | 'success' | 'warning' | 'error'} | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [userData, setUserData] = useState<any[]>([]);
  const [loginData, setLoginData] = useState({
    username: "sandeep@fastest.health",
    password: "Fastest@2004",
  });

  // Check admin session on load
  useEffect(() => {
    checkAdminSession();
  }, []);
  
  // Monitor for server restarts
  useEffect(() => {
    // Function to handle the Vite server connection status
    const handleServerStatus = (event: MessageEvent) => {
      try {
        // Check for server restart messages
        if (typeof event.data === 'string') {
          // If we detect the message "server connection lost" or "connected", it's a server restart
          if (event.data.includes('server connection lost')) {
            console.log("⚠️ EMERGENCY: SERVER RESTART DETECTED - Connection lost");
            setStatusMessage({
              text: "Server connection lost. Will attempt to reconnect...",
              type: 'warning'
            });
          } else if (event.data.includes('connected')) {
            console.log("⚠️ EMERGENCY: SERVER RESTART DETECTED - Reconnected");
            setStatusMessage({
              text: "Server reconnected. Attempting to restore session...",
              type: 'info'
            });
            
            // Delay the reconnection to allow the server to fully start
            setTimeout(() => {
              console.log("⚠️ EMERGENCY: Attempting to restore admin session after server restart");
              // Try to reconnect with Basic Auth
              reconnectAfterServerRestart();
            }, 2000);
          }
        }
      } catch (error) {
        console.error("EMERGENCY: Error processing server status message:", error);
      }
    };
    
    // Add listener for server restart detection
    window.addEventListener('message', handleServerStatus);
    
    // Clean up
    return () => {
      window.removeEventListener('message', handleServerStatus);
    };
  }, []);
  
  // Reconnect function to be called after server restart
  const reconnectAfterServerRestart = async () => {
    try {
      console.log("⚠️ EMERGENCY: Executing reconnection process after server restart");
      setStatusMessage({
        text: "Attempting emergency reconnection after server restart...",
        type: 'info'
      });
      
      // Create Basic Auth header for direct authentication
      const adminEmail = "sandeep@fastest.health";
      const adminPassword = "Fastest@2004";
      const basicAuthHeader = `Basic ${btoa(`${adminEmail}:${adminPassword}`)}`;
      
      // Use direct status endpoint with Basic Auth
      const timestamp = Date.now();
      const directResponse = await fetch(`/api/admin/direct-status?t=${timestamp}&reconnect=true&emergency=true`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
          "Authorization": basicAuthHeader,
          "X-Server-Restart": "true",
          "X-Emergency-Request": "true"
        }
      });
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log("⚠️ EMERGENCY: Reconnection response:", directData);
        
        if (directData.isAdmin) {
          console.log("✅ EMERGENCY: Successfully reconnected admin session after server restart");
          setStatusMessage({
            text: "Admin session successfully restored after server restart!",
            type: 'success'
          });
          setIsAdmin(true);
          // Reload emergency data
          loadEmergencyData();
        } else {
          console.log("❌ EMERGENCY: Failed to reconnect admin session, will try login");
          setStatusMessage({
            text: "Failed to restore session. Attempting emergency login...",
            type: 'warning'
          });
          // Attempt an emergency login
          handleEmergencyLogin();
        }
      } else {
        throw new Error(`HTTP error ${directResponse.status}`);
      }
    } catch (error) {
      console.error("⚠️ EMERGENCY: Error during reconnection:", error);
      setStatusMessage({
        text: `Reconnection failed: ${error.message}. Attempting emergency login...`,
        type: 'error'
      });
      // Try emergency login as a last resort
      handleEmergencyLogin();
    }
  };

  const checkAdminSession = async () => {
    try {
      console.log("EMERGENCY: Checking admin session via multiple methods");
      setErrorMessage(null);
      
      // Try multiple authentication methods, starting with the most reliable
      
      // 1. Try the direct status check first (most reliable)
      try {
        console.log("EMERGENCY: Trying direct-status endpoint");
        const timestamp = Date.now();
        const directResponse = await fetch(`/api/admin/direct-status?t=${timestamp}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Emergency-Request": "true"
          }
        });
        
        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log("EMERGENCY: Direct status response:", directData);
          
          if (directData.isAdmin) {
            console.log("EMERGENCY: Admin authenticated via direct status check");
            setIsAdmin(true);
            loadEmergencyData();
            return;
          } else {
            console.log("EMERGENCY: Not admin via direct status check, trying other methods");
          }
        }
      } catch (directError) {
        console.error("EMERGENCY: Direct status check error:", directError);
      }
      
      // 2. Fall back to the regular session check
      try {
        console.log("EMERGENCY: Trying regular session endpoint");
        const timestamp = Date.now();
        const sessionResponse = await fetch(`/api/admin/session?t=${timestamp}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          console.log("EMERGENCY: Regular session response:", sessionData);
          
          if (sessionData.isAdmin) {
            console.log("EMERGENCY: Admin authenticated via regular session check");
            setIsAdmin(true);
            loadEmergencyData();
            return;
          } else {
            console.log("EMERGENCY: Not admin via regular session, falling back to emergency db check");
            setIsAdmin(false);
          }
        }
      } catch (sessionError) {
        console.error("EMERGENCY: Regular session check error:", sessionError);
      }
      
      // 3. Try the emergency database check as a last resort
      try {
        console.log("EMERGENCY: Trying emergency-db-check endpoint (direct DB access)");
        const timestamp = Date.now();
        const emergencyResponse = await fetch(`/api/admin/emergency-db-check?t=${timestamp}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });
        
        if (emergencyResponse.ok) {
          const emergencyData = await emergencyResponse.json();
          console.log("EMERGENCY: Emergency DB check response:", emergencyData);
          
          // Useful diagnostic info but not auth - we're now in emergency data access mode
          if (emergencyData.dbConnectionOk) {
            setDebugInfo(emergencyData);
            if (emergencyData.fullData && Array.isArray(emergencyData.fullData)) {
              setUserData(emergencyData.fullData);
              console.log("EMERGENCY: Got data from emergency DB check");
            }
          }
        }
      } catch (emergencyError) {
        console.error("EMERGENCY: Emergency DB check error:", emergencyError);
      }
    } catch (error) {
      console.error("EMERGENCY: Session check error:", error);
      setErrorMessage("Session check failed: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyData = async () => {
    try {
      console.log("EMERGENCY: Loading diagnostic data");
      setErrorMessage(null);
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      
      // Create Basic Auth header for more reliable API access
      const adminEmail = "sandeep@fastest.health";
      const adminPassword = "Fastest@2004";
      const basicAuthHeader = `Basic ${btoa(`${adminEmail}:${adminPassword}`)}`;
      
      // First try to ensure we're authenticated using Basic Auth
      console.log("EMERGENCY: Authenticating with Basic Auth");
      try {
        const authResponse = await fetch(`/api/admin/direct-status?t=${timestamp}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Authorization": basicAuthHeader,
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
            "Pragma": "no-cache",
            "X-Emergency-Request": "true"
          }
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log("EMERGENCY: Basic Auth status:", authData);
          
          if (authData.isAdmin) {
            console.log("EMERGENCY: Successfully authenticated via Basic Auth");
            // The session should now be set for future requests
          }
        }
      } catch (authError) {
        console.error("EMERGENCY: Basic Auth error:", authError);
      }
      
      // Try the specialized emergency stats endpoint first
      console.log("EMERGENCY: Trying emergency-stats endpoint");
      try {
        const statsResponse = await fetch(`/api/admin/emergency-stats?t=${timestamp}&uid=${uniqueId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
            "Pragma": "no-cache",
            "X-Emergency-Request": "true",
            "Authorization": basicAuthHeader // Add Basic Auth header for reliable access
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log("🟢 EMERGENCY STATS SUCCESS:", statsData);
          
          setDebugInfo({
            dbConnectionOk: true,
            userCount: statsData.counts.users,
            timestamp: statsData.timestamp,
            sessionInfo: statsData.sessionInfo,
            timing: statsData.timing,
            databaseStats: statsData.counts
          });
          
          // If we have user samples, display them
          if (statsData.samples && statsData.samples.users && statsData.samples.users.length > 0) {
            console.log("EMERGENCY: Got user samples from emergency-stats");
            
            // Try to get full user data now that we know the connection works
            try {
              const usersResponse = await fetch(`/api/admin/users?t=${timestamp}&emergency=true`, {
                method: "GET",
                credentials: "include",
                headers: {
                  "Accept": "application/json",
                  "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
                  "Pragma": "no-cache",
                  "X-Emergency-Request": "true"
                }
              });
              
              if (usersResponse.ok) {
                const users = await usersResponse.json();
                console.log("EMERGENCY: Got full user data:", users.length, "users");
                if (Array.isArray(users) && users.length > 0) {
                  setUserData(users);
                  return; // Success
                }
              }
              
              // If that fails, at least show the samples
              console.log("EMERGENCY: Using samples as fallback");
              setUserData(statsData.samples.users);
              return;
            } catch (usersError) {
              console.error("EMERGENCY: Error fetching full users:", usersError);
              // Still use the samples
              setUserData(statsData.samples.users);
              return;
            }
          }
        }
      } catch (statsError) {
        console.error("EMERGENCY: Stats endpoint error:", statsError);
        setErrorMessage("Stats endpoint error: " + String(statsError));
      }
      
      // If the new endpoint failed, try the older emergency endpoint 
      console.log("EMERGENCY: Trying emergency-db-check endpoint");
      try {
        const emergencyResponse = await fetch(`/api/admin/emergency-db-check?t=${timestamp}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, private",
            "Pragma": "no-cache"
          }
        });

        if (emergencyResponse.ok) {
          const data = await emergencyResponse.json();
          console.log("EMERGENCY CHECK RESPONSE:", data);
          setDebugInfo(data);
          
          if (data.fullData && Array.isArray(data.fullData)) {
            setUserData(data.fullData);
            return; // If we got data, we're done
          }
        }
      } catch (emergencyError) {
        console.error("EMERGENCY: Emergency check error:", emergencyError);
      }

      // If the emergency endpoints failed, try the regular endpoint
      console.log("EMERGENCY: Trying regular users endpoint");
      try {
        const usersResponse = await fetch(`/api/admin/users?t=${timestamp}&nocache=true`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, private",
            "Pragma": "no-cache"
          }
        });

        if (usersResponse.ok) {
          const users = await usersResponse.json();
          console.log("EMERGENCY: Regular users response:", users);
          if (Array.isArray(users)) {
            setUserData(users);
            return;
          }
        }
      } catch (usersError) {
        console.error("EMERGENCY: Users endpoint error:", usersError);
      }
      
      // As absolute last resort, try with XHR
      console.log("EMERGENCY: Trying XHR as last resort");
      const xhr = new XMLHttpRequest();
      const xhrUrl = `/api/admin/users?t=${timestamp}&xhr=true`;
      console.log("EMERGENCY: XHR URL:", xhrUrl);
      
      xhr.open("GET", xhrUrl, true);
      xhr.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate, private, max-age=0");
      xhr.setRequestHeader("Pragma", "no-cache");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      xhr.setRequestHeader("X-Production-Emergency", "true");
      xhr.withCredentials = true;
      
      xhr.onload = function() {
        console.log("EMERGENCY: XHR status:", xhr.status);
        console.log("EMERGENCY: XHR headers:", xhr.getAllResponseHeaders());
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            console.log("EMERGENCY: XHR response text (first 100 chars):", xhr.responseText.substring(0, 100));
            const xhrData = JSON.parse(xhr.responseText);
            console.log("EMERGENCY: XHR parsed response:", xhrData);
            if (Array.isArray(xhrData)) {
              setUserData(xhrData);
            } else {
              setErrorMessage("XHR response not an array: " + typeof xhrData);
            }
          } catch (e) {
            console.error("EMERGENCY: XHR parse error:", e);
            setErrorMessage("XHR parse error: " + String(e));
          }
        } else {
          console.error("EMERGENCY: XHR failed with status:", xhr.status);
          setErrorMessage(`XHR request failed: ${xhr.status}`);
        }
      };
      
      xhr.onerror = function() {
        console.error("EMERGENCY: XHR network error");
        setErrorMessage("XHR network error");
      };
      
      xhr.send();
    } catch (error) {
      console.error("EMERGENCY: Data load error:", error);
      setErrorMessage("Data load error: " + String(error));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      
      console.log("EMERGENCY: Attempting admin login via emergency endpoint");
      
      // Create Basic Auth header for more reliable API access
      const adminEmail = "sandeep@fastest.health";
      const adminPassword = "Fastest@2004";
      const basicAuthHeader = `Basic ${btoa(`${adminEmail}:${adminPassword}`)}`;
      
      // Try the emergency login endpoint first
      try {
        const emergencyResponse = await fetch("/api/admin/emergency-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Emergency-Request": "true",
            "Authorization": basicAuthHeader // Add Basic Auth for direct authentication
          },
          credentials: "include",
          body: JSON.stringify(loginData)
        });
        
        const emergencyResult = await emergencyResponse.json();
        console.log("EMERGENCY: Emergency login response:", emergencyResult);
        
        if (emergencyResult.success) {
          console.log("EMERGENCY: Login successful via emergency endpoint");
          setIsAdmin(true);
          loadEmergencyData();
          return;
        } else {
          console.log("EMERGENCY: Emergency login failed, trying regular endpoint");
        }
      } catch (emergencyError) {
        console.error("EMERGENCY: Emergency login error:", emergencyError);
      }
      
      // Fall back to regular admin login if emergency login failed
      console.log("EMERGENCY: Attempting admin login via regular endpoint");
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Authorization": basicAuthHeader // Add Basic Auth for direct authentication
        },
        credentials: "include",
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      console.log("EMERGENCY: Regular login response:", result);
      
      if (result.success) {
        setIsAdmin(true);
        loadEmergencyData();
      } else {
        setErrorMessage(result.message || "Login failed");
      }
    } catch (error) {
      console.error("EMERGENCY: Login error:", error);
      setErrorMessage("Login error: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        <h1>EMERGENCY ADMIN CONSOLE</h1>
        <div>Loading... Please wait.</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        <h1>EMERGENCY ADMIN CONSOLE</h1>
        <div style={{ marginBottom: "20px" }}>
          <a 
            href="#" 
            onClick={(e) => { 
              e.preventDefault(); 
              navigate("/admin"); 
            }}
            style={{ 
              display: "inline-block", 
              marginBottom: "20px",
              textDecoration: "none",
              padding: "5px 10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              color: "#333"
            }}
          >
            Return to Standard Admin
          </a>
        </div>
        
        {errorMessage && (
          <div style={{ color: "red", marginBottom: "20px", fontWeight: "bold" }}>
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ maxWidth: "400px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Email:
            </label>
            <input
              type="text"
              name="username"
              value={loginData.username}
              onChange={handleInputChange}
              style={{ 
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
              placeholder="Enter admin email"
            />
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Password:
            </label>
            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleInputChange}
              style={{ 
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
              placeholder="Enter admin password"
            />
          </div>
          
          <button
            type="submit"
            style={{ 
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>EMERGENCY ADMIN CONSOLE</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <a 
          href="#" 
          onClick={(e) => { 
            e.preventDefault(); 
            navigate("/admin"); 
          }}
          style={{ 
            display: "inline-block", 
            marginRight: "15px",
            textDecoration: "none",
            padding: "5px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            color: "#333"
          }}
        >
          Return to Standard Admin
        </a>
        
        <button
          onClick={loadEmergencyData}
          style={{ 
            backgroundColor: "#f44336",
            color: "white",
            padding: "5px 10px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Force Refresh Data
        </button>
        
        <button
          onClick={checkAdminSession}
          style={{ 
            backgroundColor: "#4285F4",
            color: "white",
            padding: "5px 10px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Check Auth Status
        </button>
      </div>
      
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "20px", fontWeight: "bold", padding: "10px", backgroundColor: "#ffeeee", border: "1px solid #ffcccc" }}>
          {errorMessage}
        </div>
      )}
      
      <h2>Database Status</h2>
      {debugInfo ? (
        <div style={{ marginBottom: "30px" }}>
          <div>Connection Status: {debugInfo.dbConnectionOk ? "✅ Connected" : "❌ Failed"}</div>
          <div>Timestamp: {debugInfo.timestamp}</div>
          
          {debugInfo.databaseStats && (
            <div style={{ marginTop: "10px", marginBottom: "10px" }}>
              <h3>Database Counts:</h3>
              <ul style={{ listStyleType: "none", padding: "10px", backgroundColor: "#f0f8ff", border: "1px solid #cce5ff", borderRadius: "4px" }}>
                {Object.entries(debugInfo.databaseStats).map(([key, value]) => (
                  <li key={key} style={{ marginBottom: "5px" }}>
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {debugInfo.timing && (
            <div style={{ marginTop: "10px", marginBottom: "10px" }}>
              <h3>Query Times:</h3>
              <ul style={{ listStyleType: "none", padding: "10px", backgroundColor: "#fff3cd", border: "1px solid #ffeeba", borderRadius: "4px" }}>
                {Object.entries(debugInfo.timing).map(([key, value]) => (
                  <li key={key} style={{ marginBottom: "5px" }}>
                    <strong>{key}:</strong> {String(value)}ms
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h3>Session Info:</h3>
            <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
              {formatJSON(debugInfo.sessionInfo)}
            </pre>
          </div>
        </div>
      ) : (
        <div>No database status information available</div>
      )}
      
      <h2>User Data</h2>
      {userData.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>ID</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Username</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Email</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Name</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{user.id}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{user.username}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{user.email}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {user.firstName || user.first_name} {user.lastName || user.last_name}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {new Date(user.createdAt || user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>No user data available</div>
      )}
      
      <h2>Raw User Data</h2>
      <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", maxHeight: "400px", overflow: "auto" }}>
        {formatJSON(userData)}
      </pre>
    </div>
  );
}