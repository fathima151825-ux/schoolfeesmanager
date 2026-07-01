import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import Icon from '../../components/AppIcon';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import { supabase } from '../../lib/supabase';

const AcademicYearManagement = () => {
  const { currentAcademicYear, academicYears, loading, refresh } = useAcademicYear();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newYear, setNewYear] = useState({ yearName: '', startDate: '', endDate: '', description: '' });
  const [copyFromYearId, setCopyFromYearId] = useState('');
  const [saving, setSaving] = useState(false);
  const [settingCurrent, setSettingCurrent] = useState(null);
  const [copyingFees, setCopyingFees] = useState(null);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const validateForm = () => {
    const errs = {};
    if (!newYear?.yearName?.trim()) errs.yearName = 'Year name is required (e.g. 2026-2027)';
    if (!newYear?.startDate) errs.startDate = 'Start date is required';
    if (!newYear?.endDate) errs.endDate = 'End date is required';
    if (newYear?.startDate && newYear?.endDate && newYear?.startDate >= newYear?.endDate) {
      errs.endDate = 'End date must be after start date';
    }
    const duplicate = academicYears?.find(y => (y?.yearName || y?.year_name) === newYear?.yearName?.trim());
    if (duplicate) errs.yearName = 'This academic year already exists';
    setErrors(errs);
    return Object.keys(errs)?.length === 0;
  };

  const handleAddYear = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const { error } = await supabase?.from('academic_years')?.insert({
        year_name: newYear?.yearName?.trim(),
        start_date: newYear?.startDate,
        end_date: newYear?.endDate,
        description: newYear?.description?.trim() || null,
        is_current: false
      });
      if (error) throw error;

      // Copy fee structure if requested
      if (copyFromYearId) {
        const { data: newYearData } = await supabase?.from('academic_years')?.select('id')?.eq('year_name', newYear?.yearName?.trim())?.single();
        if (newYearData?.id) {
          await supabase?.rpc('copy_fee_structure', {
            p_source_year_id: copyFromYearId,
            p_target_year_id: newYearData?.id
          });
        }
      }

      await refresh();
      setShowAddForm(false);
      setNewYear({ yearName: '', startDate: '', endDate: '', description: '' });
      setCopyFromYearId('');
      setErrors({});
      showMsg(copyFromYearId ? 'Academic year created and fee structure copied successfully!' : 'Academic year created successfully!');
    } catch (err) {
      showMsg(err?.message || 'Failed to create academic year', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (yearId) => {
    setSettingCurrent(yearId);
    try {
      const { error } = await supabase?.rpc('set_current_academic_year', { p_year_id: yearId });
      if (error) throw error;
      await refresh();
      showMsg('Current academic year updated! All modules will now use this year.');
    } catch (err) {
      showMsg(err?.message || 'Failed to set current year', 'error');
    } finally {
      setSettingCurrent(null);
    }
  };

  const handleCopyFees = async (targetYearId) => {
    if (!currentAcademicYear?.id) {
      showMsg('No current academic year to copy from', 'error');
      return;
    }
    setCopyingFees(targetYearId);
    try {
      const { data, error } = await supabase?.rpc('copy_fee_structure', {
        p_source_year_id: currentAcademicYear?.id,
        p_target_year_id: targetYearId
      });
      if (error) throw error;
      showMsg(`Fee structure copied successfully! (${data || 0} entries copied)`);
    } catch (err) {
      showMsg(err?.message || 'Failed to copy fee structure', 'error');
    } finally {
      setCopyingFees(null);
    }
  };

  const suggestYearName = () => {
    const today = new Date();
    const year = today?.getFullYear();
    const month = today?.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const suggested = `${startYear + 1}-${startYear + 2}`;
    const suggestedStart = `${startYear + 1}-04-01`;
    const suggestedEnd = `${startYear + 2}-03-31`;
    setNewYear(prev => ({
      ...prev,
      yearName: prev?.yearName || suggested,
      startDate: prev?.startDate || suggestedStart,
      endDate: prev?.endDate || suggestedEnd
    }));
  };

  return (
    <>
      <Helmet>
        <title>Academic Year Management - SSVM</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <AdminSidebarNavigation />
        <div className="lg:ml-64">
          <BrandHeader variant="admin" />
          <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
                    Academic Year Management
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage academic years. Only one year can be active at a time — the entire application follows it.
                  </p>
                </div>
                <button
                  onClick={() => { setShowAddForm(true); suggestYearName(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Icon name="Plus" size={16} />
                  <span className="hidden sm:inline">New Year</span>
                </button>
              </div>

              {/* Message */}
              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                  message?.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  <Icon name={message?.type === 'error' ? 'AlertCircle' : 'CheckCircle'} size={16} />
                  {message?.text}
                </div>
              )}

              {/* Current Year Banner */}
              {currentAcademicYear && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Calendar" size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Academic Year</p>
                    <p className="text-lg font-bold text-primary">
                      {currentAcademicYear?.yearName || currentAcademicYear?.year_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All modules (Dashboard, Payments, Reports, Fee Structure) use this year automatically
                    </p>
                  </div>
                </div>
              )}

              {/* Add Form */}
              {showAddForm && (
                <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                      <Icon name="PlusCircle" size={20} className="text-primary" />
                      Create New Academic Year
                    </h2>
                    <button onClick={() => { setShowAddForm(false); setErrors({}); }} className="text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Year Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2026-2027"
                        value={newYear?.yearName}
                        onChange={e => setNewYear(p => ({ ...p, yearName: e?.target?.value }))}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors?.yearName ? 'border-red-400' : 'border-border'}`}
                      />
                      {errors?.yearName && <p className="text-xs text-red-500 mt-1">{errors?.yearName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Optional description"
                        value={newYear?.description}
                        onChange={e => setNewYear(p => ({ ...p, description: e?.target?.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newYear?.startDate}
                        onChange={e => setNewYear(p => ({ ...p, startDate: e?.target?.value }))}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors?.startDate ? 'border-red-400' : 'border-border'}`}
                      />
                      {errors?.startDate && <p className="text-xs text-red-500 mt-1">{errors?.startDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newYear?.endDate}
                        onChange={e => setNewYear(p => ({ ...p, endDate: e?.target?.value }))}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors?.endDate ? 'border-red-400' : 'border-border'}`}
                      />
                      {errors?.endDate && <p className="text-xs text-red-500 mt-1">{errors?.endDate}</p>}
                    </div>
                  </div>

                  {/* Copy Fee Structure Option */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                      <Icon name="Copy" size={14} className="text-blue-600" />
                      Copy Fee Structure From (Optional)
                    </label>
                    <select
                      value={copyFromYearId}
                      onChange={e => setCopyFromYearId(e?.target?.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="">— Don't copy, start fresh —</option>
                      {academicYears?.map(y => (
                        <option key={y?.id} value={y?.id}>
                          {y?.yearName || y?.year_name} {(y?.isCurrent || y?.is_current) ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-blue-600 mt-1">
                      Copies class fee templates only. Payments and receipts are NOT copied.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddYear}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
                      {saving ? 'Creating...' : 'Create Academic Year'}
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setErrors({}); }}
                      className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Academic Years List */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Icon name="Loader2" size={32} className="animate-spin text-primary" />
                </div>
              ) : academicYears?.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-lg">
                  <Icon name="Calendar" size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">No academic years found. Create one to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {academicYears?.map(year => {
                    const isCurrent = year?.isCurrent || year?.is_current;
                    const yearId = year?.id;
                    const yearName = year?.yearName || year?.year_name;
                    return (
                      <div
                        key={yearId}
                        className={`bg-card border rounded-lg p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                          isCurrent ? 'border-primary/40 shadow-sm' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCurrent ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <Icon name="Calendar" size={18} className={isCurrent ? 'text-primary' : 'text-muted-foreground'} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{yearName}</span>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {year?.startDate || year?.start_date} → {year?.endDate || year?.end_date}
                              {year?.description ? ` • ${year?.description}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isCurrent && (
                            <button
                              onClick={() => handleSetCurrent(yearId)}
                              disabled={settingCurrent === yearId}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                            >
                              {settingCurrent === yearId ? (
                                <Icon name="Loader2" size={12} className="animate-spin" />
                              ) : (
                                <Icon name="CheckCircle" size={12} />
                              )}
                              Set as Current
                            </button>
                          )}
                          {!isCurrent && (
                            <button
                              onClick={() => handleCopyFees(yearId)}
                              disabled={copyingFees === yearId}
                              title={`Copy fee structure from ${currentAcademicYear?.yearName || 'current year'} to ${yearName}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
                            >
                              {copyingFees === yearId ? (
                                <Icon name="Loader2" size={12} className="animate-spin" />
                              ) : (
                                <Icon name="Copy" size={12} />
                              )}
                              Copy Fees
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 space-y-1">
                    <p><strong>How it works:</strong></p>
                    <p>• Only ONE year can be marked as <strong>Current</strong> at a time.</p>
                    <p>• All modules (Dashboard, Payments, Reports, Fee Structure) automatically use the Current year.</p>
                    <p>• <strong>Copy Fees</strong> copies the fee template from the current year — not payments or receipts.</p>
                    <p>• Student balances are always calculated per academic year — previous years are never affected.</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AcademicYearManagement;
