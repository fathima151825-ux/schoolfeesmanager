import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ExcelUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  const requiredColumns = [
    'admission_number',
    'student_name',
    'class',
    'section',
    'father_name',
    'mother_name',
    'mobile_number',
    'address',
    'date_of_joining',
    'date_of_birth',
    'academic_year'
  ];

  const isValidDate = (val) => {
    if (!val) return false;
    return /^\d{4}-\d{2}-\d{2}$/?.test(String(val)?.trim());
  };

  const isValidMobile = (val) => {
    if (!val) return false;
    return /^\d{10}$/?.test(String(val)?.trim());
  };

  const isValidAcademicYear = (val) => {
    if (!val) return false;
    return /^\d{4}-\d{2,4}$/?.test(String(val)?.trim());
  };

  const validateRows = (rows) => {
    const errors = [];
    const seenAdmissions = new Map();

    rows?.forEach((row, idx) => {
      const rowNum = idx + 2; // 1-indexed + header row
      const rowErrors = [];

      // Required field checks
      requiredColumns?.forEach((col) => {
        if (!row?.[col] || String(row?.[col])?.trim() === '') {
          rowErrors?.push(`"${col}" is missing`);
        }
      });

      // Date format checks
      if (row?.date_of_joining && !isValidDate(row?.date_of_joining)) {
        rowErrors?.push(`"date_of_joining" must be YYYY-MM-DD (got: ${row?.date_of_joining})`);
      }
      if (row?.date_of_birth && !isValidDate(row?.date_of_birth)) {
        rowErrors?.push(`"date_of_birth" must be YYYY-MM-DD (got: ${row?.date_of_birth})`);
      }

      // Mobile number check
      if (row?.mobile_number && !isValidMobile(row?.mobile_number)) {
        rowErrors?.push(`"mobile_number" must be 10 digits (got: ${row?.mobile_number})`);
      }
      if (row?.mother_mobile && !isValidMobile(row?.mother_mobile)) {
        rowErrors?.push(`"mother_mobile" must be 10 digits (got: ${row?.mother_mobile})`);
      }

      // Academic year check
      if (row?.academic_year && !isValidAcademicYear(row?.academic_year)) {
        rowErrors?.push(`"academic_year" format should be YYYY-YY (got: ${row?.academic_year})`);
      }

      // Duplicate admission number check
      const admNo = String(row?.admission_number || '')?.trim();
      if (admNo) {
        if (seenAdmissions?.has(admNo)) {
          rowErrors?.push(`Duplicate admission_number "${admNo}" (first seen at row ${seenAdmissions?.get(admNo)})`);
        } else {
          seenAdmissions?.set(admNo, rowNum);
        }
      }

      if (rowErrors?.length > 0) {
        errors?.push({ row: rowNum, student: row?.student_name || '—', errors: rowErrors });
      }
    });

    return errors;
  };

  const handleFileChange = (e) => {
    const selectedFile = e?.target?.files?.[0];
    setError('');
    setPreviewData([]);
    setValidationErrors([]);
    setTotalRows(0);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes?.includes(selectedFile?.type)) {
      setError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      setFile(null);
      return;
    }

    if (selectedFile?.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    parseExcelFile(selectedFile);
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e?.target?.result);
        const workbook = XLSX?.read(data, { type: 'array' });
        const firstSheet = workbook?.Sheets?.[workbook?.SheetNames?.[0]];
        const jsonData = XLSX?.utils?.sheet_to_json(firstSheet, { raw: false });

        if (!jsonData || jsonData?.length === 0) {
          setError('Excel file is empty. Please add student data.');
          setFile(null);
          return;
        }

        const fileColumns = Object.keys(jsonData?.[0] || {});
        const missingColumns = requiredColumns?.filter(
          col => !fileColumns?.includes(col)
        );

        if (missingColumns?.length > 0) {
          setError(`Missing required columns: ${missingColumns?.join(', ')}`);
          setFile(null);
          return;
        }

        setTotalRows(jsonData?.length);
        setPreviewData(jsonData?.slice(0, 5));
        const errors = validateRows(jsonData);
        setValidationErrors(errors);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setError('Failed to parse Excel file. Please check the file format.');
        setFile(null);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setFile(null);
    };

    reader?.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e?.target?.result);
          const workbook = XLSX?.read(data, { type: 'array' });
          const firstSheet = workbook?.Sheets?.[workbook?.SheetNames?.[0]];
          const jsonData = XLSX?.utils?.sheet_to_json(firstSheet, { raw: false });

          await onUploadSuccess(jsonData);
          handleClose();
        } catch (err) {
          console.error('Upload error:', err);
          setError(err?.message || 'Failed to upload students. Please try again.');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
        setUploading(false);
      };

      reader?.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload students. Please try again.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    setPreviewData([]);
    setValidationErrors([]);
    setTotalRows(0);
    onClose();
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        admission_number: '',
        student_name: '',
        class: '',
        section: '',
        father_name: '',
        mother_name: '',
        mobile_number: '',
        mother_mobile: '',
        address: '',
        date_of_joining: '',
        aadhaar_number: '',
        community: '',
        date_of_birth: '',
        blood_group: '',
        academic_year: ''
      }
    ];

    const worksheet = XLSX?.utils?.json_to_sheet(templateData);
    const workbook = XLSX?.utils?.book_new();
    XLSX?.utils?.book_append_sheet(workbook, worksheet, 'Students');
    XLSX?.writeFile(workbook, 'student_upload_template.xlsx');
  };

  if (!isOpen) return null;

  const hasErrors = validationErrors?.length > 0;
  const validRowCount = totalRows - validationErrors?.length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-warm-xl max-w-3xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Upload" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-heading font-bold text-foreground">
                Bulk Student Upload
              </h2>
              <p className="text-sm text-muted-foreground font-caption">
                Upload Excel file with student data
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            disabled={uploading}
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground font-caption">
              <p className="font-semibold text-foreground mb-1">Upload Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Download the template file to see the required format</li>
                <li>Fill in student data with all required columns</li>
                <li>Date format: YYYY-MM-DD (e.g., 2024-06-15)</li>
                <li>Maximum file size: 5MB</li>
                <li>Supported formats: .xlsx, .xls, .csv</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            iconName="Download"
            iconPosition="left"
            disabled={uploading}
          >
            Download Template
          </Button>
        </div>

        <div className="mb-6">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            error={error}
            label="Select Excel File"
            disabled={uploading}
          />
        </div>

        {/* Validation Summary Banner */}
        {totalRows > 0 && (
          <div className={`mb-4 p-3 rounded-lg border flex items-center gap-3 ${hasErrors ? 'bg-destructive/5 border-destructive/30' : 'bg-success/5 border-success/30'}`}>
            <Icon
              name={hasErrors ? 'AlertTriangle' : 'CheckCircle'}
              size={18}
              className={hasErrors ? 'text-destructive flex-shrink-0' : 'text-success flex-shrink-0'}
            />
            <div className="text-sm">
              <span className="font-semibold text-foreground">
                {totalRows} row{totalRows !== 1 ? 's' : ''} detected
              </span>
              {hasErrors ? (
                <span className="text-destructive ml-1">
                  — {validationErrors?.length} row{validationErrors?.length !== 1 ? 's' : ''} have errors, {validRowCount} valid
                </span>
              ) : (
                <span className="text-success ml-1">— All rows passed validation ✓</span>
              )}
            </div>
          </div>
        )}

        {/* Data Preview Table */}
        {previewData?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="Eye" size={15} className="text-muted-foreground" />
              Data Preview (First {previewData?.length} of {totalRows} rows)
            </h3>
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Row</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Adm. No.</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Class</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Section</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Father Name</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Mobile</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Mother Mobile</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">DOB</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Blood Group</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Acad. Year</th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData?.map((row, index) => {
                    const rowNum = index + 2;
                    const rowHasError = validationErrors?.some(e => e?.row === rowNum);
                    return (
                      <tr
                        key={index}
                        className={`border-t border-border ${rowHasError ? 'bg-destructive/5' : ''}`}
                      >
                        <td className="px-2 py-2 text-muted-foreground">{rowNum}</td>
                        <td className="px-2 py-2 font-mono">{row?.admission_number || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">{row?.student_name || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">{row?.class || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">{row?.section || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">{row?.father_name || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">{row?.mobile_number || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">{row?.mother_mobile || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-2 py-2">{row?.date_of_birth || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">{row?.blood_group || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-2 py-2">{row?.academic_year || <span className="text-destructive">—</span>}</td>
                        <td className="px-2 py-2">
                          {rowHasError ? (
                            <span className="inline-flex items-center gap-1 text-destructive font-medium">
                              <Icon name="AlertCircle" size={12} /> Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-success font-medium">
                              <Icon name="CheckCircle" size={12} /> OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Validation Errors Panel */}
        {validationErrors?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
              <Icon name="AlertTriangle" size={15} />
              Validation Errors ({validationErrors?.length} row{validationErrors?.length !== 1 ? 's' : ''})
            </h3>
            <div className="border border-destructive/30 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
              {validationErrors?.map((item, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 text-xs ${i % 2 === 0 ? 'bg-destructive/5' : 'bg-background'} border-b border-destructive/10 last:border-b-0`}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-destructive whitespace-nowrap">Row {item?.row}</span>
                    {item?.student && item?.student !== '—' && (
                      <span className="text-muted-foreground">({item?.student})</span>
                    )}
                    <span className="text-muted-foreground">—</span>
                    <ul className="flex flex-col gap-0.5">
                      {item?.errors?.map((err, j) => (
                        <li key={j} className="text-destructive">{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Fix the errors in your Excel file and re-upload, or proceed to import only valid rows.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="lg"
            fullWidth
            onClick={handleUpload}
            loading={uploading}
            disabled={!file || uploading}
            iconName="Upload"
            iconPosition="left"
          >
            {hasErrors ? `Import Anyway (${validRowCount} valid)` : `Upload ${totalRows > 0 ? totalRows + ' ' : ''}Students`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;