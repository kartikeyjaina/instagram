import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/authService";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.register(
        formData.username,
        formData.email,
        formData.password,
      );
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.error ||
          error.message ||
          "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="auth-card">
      <div className="auth-brand">
        <span className="auth-brand-mark">I</span>
      </div>

      <div className="stack-sm auth-center">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-copy">Set up your workspace in a few steps.</p>
      </div>

      {errors.submit && <div className="field-error">{errors.submit}</div>}

      <form onSubmit={handleSubmit} className="form-stack">
        <div className="field">
          <label htmlFor="username" className="field-label">
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a unique username"
          />
          {errors.username && (
            <span className="field-error">{errors.username}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
          />
          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="confirmPassword" className="field-label">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword}</span>
          )}
        </div>

        <Button type="submit" disabled={loading} block>
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <p className="auth-copy auth-center">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Card>
  );
}

export default Register;
