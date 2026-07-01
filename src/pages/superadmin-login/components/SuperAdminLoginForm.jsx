import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { signInSuperAdmin } from '../../../services/superAdminService';
import { useAuth } from '../../../contexts/AuthContext';

const SuperAdminLoginForm = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData?.username?.trim()) newErrors.username = 'Username is required';
    if (!formData?.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await signInSuperAdmin(formData?.username, formData?.password);
      // Refresh AuthContext so ProtectedRoute sees the superadmin session
      await refreshAuth();
      navigate('/superadmin-dashboard');
    } catch (error) {
      setErrors({ submit: error?.message || 'Invalid credentials' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <Input
        label="Username"
        type="text"
        placeholder="Enter superadmin username"
        value={formData?.username}
        onChange={(e) => handleChange('username', e?.target?.value)}
        error={errors?.username}
        required
        disabled={isLoading}
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter password"
          value={formData?.password}
          onChange={(e) => handleChange('password', e?.target?.value)}
          error={errors?.password}
          required
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={20} />
        </button>
      </div>
      {errors?.submit && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
          <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{errors?.submit}</p>
        </div>
      )}
      <Button
        type="submit"
        variant="default"
        fullWidth
        loading={isLoading}
        iconName="ShieldCheck"
        iconPosition="right"
        className="mt-2"
      >
        {isLoading ? 'Authenticating...' : 'Sign In as Superadmin'}
      </Button>
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => navigate('/admin-login')}
          className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="ArrowLeft" size={16} />
          Back to Admin Login
        </button>
      </div>
    </form>
  );
};

export default SuperAdminLoginForm;
