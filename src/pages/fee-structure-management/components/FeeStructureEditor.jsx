import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const TERMS = [
  { id: 'term1', label: 'Term 1', period: 'June – September' },
  { id: 'term2', label: 'Term 2', period: 'October – January' },
  { id: 'term3', label: 'Term 3', period: 'February – May' }
];

/**
 * FeeStructureEditor
 * Props:
 *   classId       — UUID from classes master table (required)
 *   className     — display name e.g. "X" (for class_name column, kept for backward compat)
 *   academicYearId — UUID
 *   feeCategories  — [{ id, name }]
 *   existingData   — rows from class_fee_structures for this class+year
 *   onSaved        — callback after successful save
 */
const FeeStructureEditor = ({ classId, className, academicYearId, feeCategories, existingData, onSaved }) => {
  const buildInitialAmounts = useCallback(() => {
    const map = {};
    TERMS?.forEach(t => {
      map[t.id] = {};
      feeCategories?.forEach(cat => {
        const found = existingData?.find(
          d => d?.term === t?.id && (d?.feeCategoryId === cat?.id || d?.fee_category_id === cat?.id)
        );
        map[t.id][cat.id] = found ? String(found?.amount ?? '') : '';
      });
    });
    return map;
  }, [existingData, feeCategories]);

  const [amounts, setAmounts] = useState(buildInitialAmounts);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    setAmounts(buildInitialAmounts());
  }, [buildInitialAmounts]);

  const handleChange = (term, catId, value) => {
    setAmounts(prev => ({
      ...prev,
      [term]: { ...prev?.[term], [catId]: value }
    }));
  };

  const handleSave = async () => {
    if (!classId) {
      setSaveMsg({ type: 'error', text: 'No class selected. Please select a class first.' });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      const rows = [];
      TERMS?.forEach(t => {
        feeCategories?.forEach(cat => {
          const val = amounts?.[t?.id]?.[cat?.id];
          if (val !== '' && val !== undefined && val !== null) {
            rows?.push({
              class_id: classId,          // UUID — primary key for lookup
              class_name: className || null, // kept for display/legacy
              academic_year_id: academicYearId,
              term: t?.id,
              fee_category_id: cat?.id,
              amount: parseFloat(val) || 0,
              updated_at: new Date()?.toISOString()
            });
          }
        });
      });

      if (rows?.length === 0) {
        setSaveMsg({ type: 'error', text: 'Please enter at least one fee amount.' });
        setSaving(false);
        return;
      }

      // Use class_id-based unique constraint
      const { error } = await supabase
        ?.from('class_fee_structures')
        ?.upsert(rows, { onConflict: 'class_id,academic_year_id,term,fee_category_id' });

      if (error) throw error;
      setSaveMsg({ type: 'success', text: 'Fee structure saved successfully!' });
      onSaved?.();
    } catch (err) {
      setSaveMsg({ type: 'error', text: err?.message || 'Failed to save fee structure.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {TERMS?.map(term => (
        <div key={term?.id} className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 flex items-center gap-2">
            <Icon name="Calendar" size={16} className="text-primary" />
            <span className="font-semibold text-sm text-foreground">{term?.label}</span>
            <span className="text-xs text-muted-foreground">({term?.period})</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {feeCategories?.map(cat => (
              <div key={cat?.id}>
                <label className="block text-xs text-muted-foreground mb-1">{cat?.name}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={amounts?.[term?.id]?.[cat?.id] ?? ''}
                    onChange={e => handleChange(term?.id, cat?.id, e?.target?.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
          {saving ? 'Saving...' : 'Save Fee Structure'}
        </button>
        {saveMsg && (
          <span className={`text-sm font-medium ${saveMsg?.type === 'success' ? 'text-success' : 'text-error'}`}>
            {saveMsg?.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default FeeStructureEditor;
