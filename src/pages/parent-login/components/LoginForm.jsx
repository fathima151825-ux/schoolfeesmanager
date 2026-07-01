import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { signInWithAdmissionNumber } from '../../../services/authService';
import { useAuth } from '../../../contexts/AuthContext';

const LoginForm = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [formData, setFormData] = useState({
    admissionNumber: '',
    dateOfBirth: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.admissionNumber?.trim()) {
      newErrors.admissionNumber = 'Admission number is required';
    }

    if (!formData?.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dobPattern = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;
      if (!dobPattern?.test(formData?.dateOfBirth)) {
        newErrors.dateOfBirth = 'Enter date in DD/MM/YYYY format (e.g. 15/05/2015)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD for database comparison
      const [day, month, year] = formData?.dateOfBirth?.split('/');
      const formattedDate = `${year}-${month}-${day}`;

      const result = await signInWithAdmissionNumber(
        formData?.admissionNumber,
        formattedDate
      );
      
      if (result?.studentId) {
        sessionStorage.setItem('currentStudentId', result?.studentId);
      }

      // Refresh AuthContext so user/profile state is populated from the new parentSession
      await refreshAuth();
      
      navigate('/advertisement-splash');
    } catch (error) {
      setErrors({
        submit: error?.message || 'Invalid admission number or date of birth'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 md:space-y-6">
      <Input
        type="text"
        name="admissionNumber"
        label="Admission Number"
        placeholder="Enter admission number"
        value={formData?.admissionNumber}
        onChange={handleInputChange}
        error={errors?.admissionNumber}
        required
        disabled={isSubmitting}
      />
      <Input
        type="text"
        name="dateOfBirth"
        label="Date of Birth"
        placeholder="DD/MM/YYYY"
        value={formData?.dateOfBirth}
        onChange={handleInputChange}
        error={errors?.dateOfBirth}
        required
        disabled={isSubmitting}
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
        loading={isSubmitting}
        disabled={isSubmitting}
        className="mt-6 md:mt-8"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};

export default LoginForm;