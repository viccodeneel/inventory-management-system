import { useState, useEffect } from "react";
import './register.css';

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", phone: "", department: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState("");
  const [viewMode, setViewMode] = useState("personnel"); // personnel or admin
  const [countdown, setCountdown] = useState(0);
  const totalCountdown = 10;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && showSuccess && registeredUser) {
      window.location.href = '/'; // redirect
    }
  }, [countdown, showSuccess, registeredUser]);

  const validateForm = () => {
    const newErrors = { name: "", email: "", phone: "", department: "" };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Full name is required";
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    if (!department.trim()) {
      newErrors.department = "Department is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      console.log("🚀 Attempting registration with:", { name, email, phone, department, requestedRole: viewMode });
      
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          department,
          requestedRole: viewMode // Send requested role for admin to track intent
        }),
      });
      
      console.log("✅ Registration response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Registration data:", data);
        
        // Show success state with countdown
        setRegisteredUser(name);
        setShowSuccess(true);
        setCountdown(totalCountdown);
        
        // Clear form
        setName("");
        setEmail("");
        setPhone("");
        setDepartment("");
        setErrors({ name: "", email: "", phone: "", department: "" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert(`Registration failed: ${err instanceof Error ? err.message : 'An unexpected error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "personnel" ? "admin" : "personnel");
  };

  if (showSuccess) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <div className="success-card">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
              </div>
            </div>
            <h2>Registration Submitted!</h2>
            <p>Welcome aboard, {registeredUser}!</p>
            <p>Your registration is pending approval.</p>
            {viewMode === "admin" && (
              <p className="admin-note">
                <strong>Admin Request:</strong> Your request for admin privileges will be reviewed separately.
              </p>
            )}

            {countdown > 0 && (
              <div className="countdown-message">
                <p>Redirecting to login page in <strong>{countdown}</strong> seconds...</p>
                <div className="countdown-bar">
                  <div 
                    className="countdown-progress" 
                    style={{width: `${((totalCountdown - countdown) / totalCountdown) * 100}%`}}
                  ></div>
                </div>
              </div>
            )}

            <div className="info-message">
              <p>You will receive notification once your account has been approved by an administrator.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container">
      <div className="registration-card">
        <button 
          className={`toggle-view-button ${viewMode === "admin" ? "admin-button" : "personnel-button"}`}
          onClick={toggleViewMode}
        >
          {viewMode === "personnel" ? "Request Admin Access" : "Switch to Personnel View"}
        </button>
        
        <div className="registration-header">
          <h2>
            {viewMode === "admin" ? "Admin Access Request" : "Personnel Registration"}
          </h2>
          <p>
            {viewMode === "admin" 
              ? "Request administrator privileges - subject to approval" 
              : "Create your account to get started - pending approval"}
          </p>
        </div>

        <div className="registration-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enter your department"
            />
            {errors.department && <div className="error-message">{errors.department}</div>}
          </div>

          {viewMode === "admin" && (
            <div className="admin-info-box">
              <h4>Admin Access Request</h4>
              <p>By requesting admin access, you are asking for elevated privileges including:</p>
              <ul>
                <li>User management capabilities</li>
                <li>System configuration access</li>
                <li>Administrative reporting features</li>
              </ul>
              <p><strong>Note:</strong> Admin requests require additional verification and approval.</p>
            </div>
          )}

          <button
            type="button"
            className="submit-button"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading 
              ? "Submitting Request..." 
              : viewMode === "admin" 
                ? "Submit Admin Request" 
                : "Submit Registration"
            }
          </button>
        </div>

        <div className="registration-footer">
          <p>
            Already have an account? <a href="/">Sign in here</a>
          </p>
          <p className="pending-note">
            All new registrations require administrator approval before access is granted.
          </p>
        </div>
      </div>
    </div>
  );
}