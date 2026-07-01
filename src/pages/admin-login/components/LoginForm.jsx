import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { signInWithEmail } from '../../../services/authService';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'owner', label: 'Owner' }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData?.username?.trim()) newErrors.username = 'Username is required';
    if (!formData?.password) newErrors.password = 'Password is required';
    if (!formData?.role) newErrors.role = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      // Convert username to internal email format
      const email = formData?.username?.includes('@')
        ? formData?.username
        : `${formData?.username}@ssvm.com`;
      await signInWithEmail(email, formData?.password);
      navigate('/admin-dashboard');
    } catch (error) {
      setErrors({
        submit: 'Invalid credentials. Please check your username and password.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 md:space-y-5 lg:space-y-6">
      <Input
        label="Username"
        type="text"
        placeholder="Enter your username"
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
          placeholder="Enter your password"
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
      <Select
        label="Role"
        placeholder="Select your role"
        options={roleOptions}
        value={formData?.role}
        onChange={(value) => handleChange('role', value)}
        error={errors?.role}
        required
        disabled={isLoading}
      />
      {errors?.submit && (
        <div className="flex items-start gap-2 p-3 md:p-4 bg-error/10 border border-error/20 rounded-lg">
          <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{errors?.submit}</p>
        </div>
      )}
      <Button
        type="submit"
        variant="default"
        fullWidth
        loading={isLoading}
        iconName="LogIn"
        iconPosition="right"
        className="mt-6 md:mt-7 lg:mt-8"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
      <div className="text-center pt-4 md:pt-5 lg:pt-6 space-y-2">
        <button
          type="button"
          onClick={() => navigate('/parent-login')}
          className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="ArrowLeft" size={16} />
          Back to Parent Login
        </button>
      </div>
    </form>
  );
};

export default LoginForm;