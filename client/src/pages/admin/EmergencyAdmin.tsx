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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [userData, setUserData] = useState<any[]>([]);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Check admin session on load
  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      console.log("EMERGENCY: Checking admin session");
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/session?t=${timestamp}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, private",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log("EMERGENCY: Admin session response:", data);

      if (data.isAdmin) {
        setIsAdmin(true);
        loadEmergencyData();
      } else {
        setIsAdmin(false);
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
      const timestamp = Date.now();
      
      // First try the emergency endpoint 
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

      // If the emergency endpoint failed, try the regular endpoint
      console.log("EMERGENCY: Trying regular users endpoint");
      const usersResponse = await fetch(`/api/admin/users?t=${timestamp}`, {
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
        }
      } else {
        // If both failed, try one more with XHR
        console.log("EMERGENCY: Trying XHR as last resort");
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/api/admin/users?t=${timestamp}`, true);
        xhr.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.withCredentials = true;
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const xhrData = JSON.parse(xhr.responseText);
              console.log("EMERGENCY: XHR response:", xhrData);
              if (Array.isArray(xhrData)) {
                setUserData(xhrData);
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
      }
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
      
      console.log("EMERGENCY: Attempting admin login");
      
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        credentials: "include",
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      console.log("EMERGENCY: Login response:", result);
      
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
            cursor: "pointer"
          }}
        >
          Force Refresh Data
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
          <div>User Count: {debugInfo.userCount}</div>
          <div>Timestamp: {debugInfo.timestamp}</div>
          <div>
            Session Info: 
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