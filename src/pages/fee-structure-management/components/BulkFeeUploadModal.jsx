import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';
import { resolveClassId } from '../../../services/feeService';

const CLASS_LIST = ['LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const TERMS = ['term1', 'term2', 'term3'];
const TERM_LABELS = { term1: 'Term 1', term2: 'Term 2', term3: 'Term 3' };

const BulkFeeUploadModal = ({ isOpen, onClose, academicYearId, feeCategories, onUploaded, classes = [] }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // { rows, errors }
  const [uploadResult, setUploadResult] = useState(null);
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  // ── Template download ──────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const catNames = feeCategories?.map(c => c?.name) || [];
    // Header row: Class, Term, then one column per fee category
    const header = ['Class', 'Term', ...catNames];
    const rows = [header];
    CLASS_LIST?.forEach(cls => {
      TERMS?.forEach(term => {
        rows?.push([cls, TERM_LABELS?.[term], ...catNames?.map(() => '0')]);
      });
    });
    const csv = rows?.map(r => r?.map(v => `"${v}"`)?.join(','))?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee_structure_template.csv';
    a?.click();
    URL.revokeObjectURL(url);
  };

  // ── CSV parser ─────────────────────────────────────────────────────────────
  const parseCSV = (text) => {
    const lines = text?.trim()?.split('\n')?.filter(l => l?.trim());
    if (lines?.length < 2) return { rows: [], errors: ['File is empty or has no data rows.'] };

    // Strip BOM
    const rawHeader = lines?.[0]?.replace(/^\uFEFF/, '');
    const headers = rawHeader?.split(',')?.map(h => h?.replace(/^"|"$/g, '')?.trim());

    const classIdx = headers?.findIndex(h => h?.toLowerCase() === 'class');
    const termIdx = headers?.findIndex(h => h?.toLowerCase() === 'term');
    if (classIdx === -1 || termIdx === -1) {
      return { rows: [], errors: ['CSV must have "Class" and "Term" columns.'] };
    }

    // Map category name → category id
    const catMap = {};
    feeCategories?.forEach(c => { catMap[c?.name?.toLowerCase()] = c?.id; });

    const rows = [];
    const errors = [];

    lines?.slice(1)?.forEach((line, i) => {
      const cols = line?.split(',')?.map(v => v?.replace(/^"|"$/g, '')?.trim());
      const rawClass = cols?.[classIdx];
      const rawTerm = cols?.[termIdx];

      const normalizedClass = rawClass?.toUpperCase()?.trim();
      const normalizedTerm = Object.entries(TERM_LABELS)?.find(
        ([, label]) => label?.toLowerCase() === rawTerm?.toLowerCase()?.trim()
      )?.[0];

      if (!CLASS_LIST?.includes(normalizedClass)) {
        errors?.push(`Row ${i + 2}: Unknown class "${rawClass}"`);
        return;
      }
      if (!normalizedTerm) {
        errors?.push(`Row ${i + 2}: Unknown term "${rawTerm}" (use "Term 1", "Term 2", or "Term 3")`);
        return;
      }

      headers?.forEach((h, idx) => {
        if (idx === classIdx || idx === termIdx) return;
        const catId = catMap?.[h?.toLowerCase()];
        if (!catId) return; // skip unknown columns silently
        const rawVal = cols?.[idx];
        const amount = parseFloat(rawVal);
        if (isNaN(amount) || amount < 0) {
          errors?.push(`Row ${i + 2}: Invalid amount "${rawVal}" for ${h}`);
          return;
        }
        rows?.push({
          class_name: normalizedClass,
          academic_year_id: academicYearId,
          term: normalizedTerm,
          fee_category_id: catId,
          amount,
          updated_at: new Date()?.toISOString()
        });
      });
    });

    return { rows, errors };
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    const ext = file?.name?.split('.')?.pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls']?.includes(ext)) {
      setPreview({ rows: [], errors: ['Only CSV, XLSX, and XLS files are supported.'] });
      return;
    }
    setFileName(file?.name);
    setParsing(true);
    setPreview(null);
    setUploadResult(null);

    try {
      if (ext === 'csv') {
        const text = await file?.text();
        const result = parseCSV(text);
        setPreview(result);
      } else {
        // XLSX/XLS — use SheetJS if available, otherwise guide user to use CSV
        if (window.XLSX) {
          const buffer = await file?.arrayBuffer();
          const wb = window.XLSX?.read(buffer, { type: 'array' });
          const ws = wb?.Sheets?.[wb?.SheetNames?.[0]];
          const csv = window.XLSX?.utils?.sheet_to_csv(ws);
          const result = parseCSV(csv);
          setPreview(result);
        } else {
          // Dynamically load SheetJS from CDN
          await loadSheetJS();
          const buffer = await file?.arrayBuffer();
          const wb = window.XLSX?.read(buffer, { type: 'array' });
          const ws = wb?.Sheets?.[wb?.SheetNames?.[0]];
          const csv = window.XLSX?.utils?.sheet_to_csv(ws);
          const result = parseCSV(csv);
          setPreview(result);
        }
      }
    } catch (err) {
      setPreview({ rows: [], errors: [`Failed to parse file: ${err?.message}`] });
    } finally {
      setParsing(false);
    }
  };

  const loadSheetJS = () => new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load XLSX library. Please use CSV format.'));
    document.head.appendChild(script);
  });

  const handleDrop = (e) => {
    e?.preventDefault();
    setDragOver(false);
    const file = e?.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) handleFile(file);
  };

  // ── Upload to Supabase ─────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!preview?.rows?.length) return;
    setUploading(true);
    setUploadResult(null);
    try {
      // Resolve class_id for each unique class_name
      const classIdCache = {};
      for (const row of preview?.rows) {
        if (!classIdCache?.[row?.class_name]) {
          // Try from classes prop first (faster), then DB fallback
          const fromProp = classes?.find(c => c?.name === row?.class_name);
          classIdCache[row.class_name] = fromProp?.id || (await resolveClassId(row?.class_name));
        }
      }

      const rowsWithClassId = preview?.rows?.map(row => ({
        ...row,
        class_id: classIdCache?.[row?.class_name] || null
      }));

      // Use class_id-based unique constraint if all rows have class_id; else fall back to class_name
      const allHaveClassId = rowsWithClassId?.every(r => r?.class_id);
      const conflictKey = allHaveClassId
        ? 'class_id,academic_year_id,term,fee_category_id' :'class_name,academic_year_id,term,fee_category_id';

      const { error } = await supabase
        ?.from('class_fee_structures')
        ?.upsert(rowsWithClassId, { onConflict: conflictKey });
      if (error) throw error;
      const classesUpdated = [...new Set(preview.rows.map(r => r.class_name))];
      setUploadResult({
        type: 'success',
        text: `Successfully uploaded ${preview?.rows?.length} fee entries across ${classesUpdated?.length} class(es): ${classesUpdated?.join(', ')}`
      });
      onUploaded?.();
    } catch (err) {
      setUploadResult({ type: 'error', text: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setUploadResult(null);
    setFileName('');
    if (fileInputRef?.current) fileInputRef.current.value = '';
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const uniqueClasses = preview?.rows ? [...new Set(preview.rows.map(r => r.class_name))] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="Upload" size={20} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-foreground">Bulk Fee Upload</h2>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Step 1: Download template */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Download the template</p>
                <p className="text-xs text-muted-foreground mb-3">
                  The template includes all classes, terms, and fee categories pre-filled. Just enter the amounts.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Icon name="Download" size={15} />
                  Download CSV Template
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload file */}
          <div className="p-4 bg-muted/30 border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-muted-foreground/20 text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Upload filled file</p>
                <p className="text-xs text-muted-foreground mb-3">Supports CSV, XLSX, and XLS formats.</p>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e?.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef?.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  {parsing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="Loader2" size={28} className="animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Parsing file…</p>
                    </div>
                  ) : fileName ? (
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="FileSpreadsheet" size={28} className="text-primary" />
                      <p className="text-sm font-medium text-foreground">{fileName}</p>
                      <p className="text-xs text-muted-foreground">Click to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="FileUp" size={28} className="text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop or <span className="text-primary font-medium">click to browse</span></p>
                      <p className="text-xs text-muted-foreground">CSV, XLSX, XLS</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Preview / Errors */}
          {preview && (
            <div className="space-y-3">
              {preview?.errors?.length > 0 && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="AlertCircle" size={16} className="text-error" />
                    <span className="text-sm font-medium text-error">{preview?.errors?.length} issue(s) found</span>
                  </div>
                  <ul className="space-y-1">
                    {preview?.errors?.slice(0, 5)?.map((e, i) => (
                      <li key={i} className="text-xs text-error/80">• {e}</li>
                    ))}
                    {preview?.errors?.length > 5 && (
                      <li className="text-xs text-error/60">…and {preview?.errors?.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {preview?.rows?.length > 0 && (
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="CheckCircle" size={16} className="text-success" />
                    <span className="text-sm font-medium text-success">
                      {preview?.rows?.length} fee entries ready to upload
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Classes: {uniqueClasses?.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upload result */}
          {uploadResult && (
            <div className={`p-3 rounded-lg border ${
              uploadResult?.type === 'success' ?'bg-success/10 border-success/20 text-success' :'bg-error/10 border-error/20 text-error'
            }`}>
              <div className="flex items-start gap-2">
                <Icon name={uploadResult?.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{uploadResult?.text}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            {uploadResult?.type === 'success' ? 'Close' : 'Cancel'}
          </button>
          {preview?.rows?.length > 0 && uploadResult?.type !== 'success' && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {uploading ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Upload" size={15} />}
              {uploading ? 'Uploading…' : `Upload ${preview?.rows?.length} Entries`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkFeeUploadModal;
