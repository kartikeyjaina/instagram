import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/authService";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
      await authService.login(formData.email, formData.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.error ||
          error.message ||
          "Login failed. Please try again.",
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-copy">Sign in to continue to your workspace.</p>
      </div>

      {errors.submit && <div className="field-error">{errors.submit}</div>}

      <form onSubmit={handleSubmit} className="form-stack">
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
            placeholder="Enter your password"
          />
          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <Button type="submit" disabled={loading} block>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="auth-copy auth-center">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
    </Card>
  );
}

export default Login;
