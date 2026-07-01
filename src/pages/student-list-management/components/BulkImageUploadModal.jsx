import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

const BUCKET_NAME = 'student-photos';

async function uploadBulkPhoto(file, admissionNumber) {
  const timestamp = Date.now();
  const fileExt = file?.name?.split('.')?.pop();
  const filePath = `${admissionNumber}/${timestamp}.${fileExt}`;

  const { data, error } = await supabase?.storage?.from(BUCKET_NAME)?.upload(filePath, file, {
    cacheControl: '3600',
    upsert: true
  });

  if (error) throw error;
  return data?.path;
}

async function getStudentByAdmissionNumber(admissionNumber) {
  const { data, error } = await supabase
    ?.from('students')
    ?.select('id, admission_number, name')
    ?.ilike('admission_number', admissionNumber)
    ?.single();

  if (error) return null;
  return data;
}

async function updateStudentPhoto(studentId, photoPath) {
  const { error } = await supabase
    ?.from('students')
    ?.update({ photo_url: photoPath })
    ?.eq('id', studentId);

  if (error) throw error;
}

const BulkImageUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selected = Array.from(e?.target?.files || []);
    const imageFiles = selected?.filter(f =>
      f?.type === 'image/jpeg' || f?.type === 'image/png' || f?.type === 'image/webp'
    );
    setFiles(imageFiles);
    setResults([]);
    setDone(false);
    setProgress(0);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    const dropped = Array.from(e?.dataTransfer?.files || []);
    const imageFiles = dropped?.filter(f =>
      f?.type === 'image/jpeg' || f?.type === 'image/png' || f?.type === 'image/webp'
    );
    setFiles(imageFiles);
    setResults([]);
    setDone(false);
    setProgress(0);
  };

  const handleDragOver = (e) => e?.preventDefault();

  const extractAdmissionNumber = (filename) => {
    // Remove extension: "ADM2024001.png" → "ADM2024001"
    return filename?.replace(/\.[^/.]+$/, '')?.trim();
  };

  const handleProcess = async () => {
    if (!files?.length) return;
    setProcessing(true);
    setResults([]);
    setProgress(0);

    const resultList = [];

    for (let i = 0; i < files?.length; i++) {
      const file = files?.[i];
      const admissionNumber = extractAdmissionNumber(file?.name);

      try {
        // Find student by admission number
        const student = await getStudentByAdmissionNumber(admissionNumber);

        if (!student) {
          resultList?.push({
            filename: file?.name,
            admissionNumber,
            status: 'error',
            message: `No student found with admission number "${admissionNumber}"`
          });
        } else {
          // Upload photo
          const photoPath = await uploadBulkPhoto(file, admissionNumber);
          // Update student record
          await updateStudentPhoto(student?.id, photoPath);

          resultList?.push({
            filename: file?.name,
            admissionNumber,
            studentName: student?.name,
            status: 'success',
            message: `Photo uploaded for ${student?.name}`
          });
        }
      } catch (err) {
        resultList?.push({
          filename: file?.name,
          admissionNumber,
          status: 'error',
          message: err?.message || 'Upload failed'
        });
      }

      setProgress(Math.round(((i + 1) / files?.length) * 100));
      setResults([...resultList]);
    }

    setProcessing(false);
    setDone(true);
    onUploadComplete?.();
  };

  const successCount = results?.filter(r => r?.status === 'success')?.length;
  const errorCount = results?.filter(r => r?.status === 'error')?.length;

  const handleClose = () => {
    setFiles([]);
    setResults([]);
    setDone(false);
    setProgress(0);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Images" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Bulk Photo Upload</h2>
              <p className="text-xs text-muted-foreground">Upload images named as admission_number.png</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <Icon name="Info" size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 space-y-1">
              <p className="font-medium">How it works:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Name each image file as the student's <strong>admission number</strong> (e.g. <code>ADM2024001.png</code>)</li>
                <li>Select all images at once and click <strong>Upload Photos</strong></li>
                <li>Each photo is automatically matched and saved to the student's profile</li>
              </ul>
            </div>
          </div>

          {/* Drop Zone */}
          {!done && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef?.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Icon name="ImagePlus" size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {files?.length > 0
                  ? `${files?.length} image${files?.length > 1 ? 's' : ''} selected`
                  : 'Drop images here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP accepted</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* File list preview */}
          {files?.length > 0 && !done && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Selected Files ({files?.length})
                </p>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-border">
                {files?.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2">
                    <Icon name="Image" size={16} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate">{f?.name}</span>
                    <span className="text-xs text-muted-foreground">{(f?.size / 1024)?.toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing images...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {results?.length > 0 && (
            <div className="space-y-3">
              {done && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  errorCount === 0
                    ? 'bg-green-50 border-green-200'
                    : successCount === 0
                    ? 'bg-red-50 border-red-200' :'bg-yellow-50 border-yellow-200'
                }`}>
                  <Icon
                    name={errorCount === 0 ? 'CheckCircle2' : successCount === 0 ? 'XCircle' : 'AlertCircle'}
                    size={20}
                    className={errorCount === 0 ? 'text-green-600' : successCount === 0 ? 'text-red-600' : 'text-yellow-600'}
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      {successCount} uploaded successfully
                    </span>
                    {errorCount > 0 && (
                      <span className="text-muted-foreground"> · {errorCount} failed</span>
                    )}
                  </div>
                </div>
              )}

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Results</p>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {results?.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                      <Icon
                        name={r?.status === 'success' ? 'CheckCircle2' : 'XCircle'}
                        size={16}
                        className={`flex-shrink-0 mt-0.5 ${r?.status === 'success' ? 'text-green-500' : 'text-red-500'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r?.filename}</p>
                        <p className="text-xs text-muted-foreground">{r?.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            {done ? 'Close' : 'Cancel'}
          </Button>
          {!done && (
            <Button
              variant="default"
              onClick={handleProcess}
              disabled={files?.length === 0 || processing}
              iconName={processing ? 'Loader2' : 'Upload'}
              iconPosition="left"
            >
              {processing ? 'Uploading...' : `Upload ${files?.length > 0 ? files?.length + ' ' : ''}Photo${files?.length !== 1 ? 's' : ''}`}
            </Button>
          )}
          {done && (
            <Button
              variant="default"
              onClick={() => { setFiles([]); setResults([]); setDone(false); setProgress(0); }}
              iconName="RefreshCw"
              iconPosition="left"
            >
              Upload More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImageUploadModal;
