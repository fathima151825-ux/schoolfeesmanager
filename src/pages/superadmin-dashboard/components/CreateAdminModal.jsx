import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { createAdminUser } from '../../../services/superAdminService';

const CreateAdminModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'owner', label: 'Owner' }
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData?.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/?.test(formData?.username)) {
      newErrors.username = 'Only letters, numbers, underscores allowed';
    }
    if (!formData?.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!formData?.password || formData?.password?.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData?.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (errors?.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await createAdminUser({
        username: formData?.username?.trim(),
        fullName: formData?.fullName?.trim(),
        password: formData?.password,
        role: formData?.role
      });
      onCreated?.();
      onClose?.();
    } catch (error) {
      setErrors({ submit: error?.message || 'Failed to create admin user. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="UserPlus" size={18} className="text-primary" />
            </div>
            Create Admin User
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <Input
            label="Username"
            type="text"
            placeholder="e.g. admin1"
            value={formData?.username}
            onChange={(e) => handleChange('username', e?.target?.value)}
            error={errors?.username}
            required
            disabled={isLoading}
          />

          {/* Full Name */}
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. John Doe"
            value={formData?.fullName}
            onChange={(e) => handleChange('fullName', e?.target?.value)}
            error={errors?.fullName}
            required
            disabled={isLoading}
          />

          {/* Password */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
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
            >
              <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
            </button>
          </div>

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={formData?.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e?.target?.value)}
            error={errors?.confirmPassword}
            required
            disabled={isLoading}
          />

          {/* Role */}
          <Select
            label="Role"
            options={roleOptions}
            value={formData?.role}
            onChange={(value) => handleChange('role', value)}
            error={errors?.role}
            required
            disabled={isLoading}
          />

          {/* Submit Error */}
          {errors?.submit && (
            <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
              <Icon name="AlertCircle" size={18} className="text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{errors?.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              fullWidth
              loading={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminModal;
