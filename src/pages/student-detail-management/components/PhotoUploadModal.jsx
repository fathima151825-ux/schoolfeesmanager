import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { uploadStudentPhoto, deleteStudentPhoto, updateStudentPhotoUrl, validatePhotoFile } from '../../../services/storageService';

const PhotoUploadModal = ({ isOpen, onClose, student, onPhotoUpdated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation?.valid) {
      setError(validation?.error);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader?.result);
    };
    reader?.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !student?.id) return;

    setUploading(true);
    setError(null);

    try {
      // Delete old photo if exists
      if (student?.photoUrl) {
        await deleteStudentPhoto(student?.photoUrl);
      }

      // Upload new photo
      const { filePath } = await uploadStudentPhoto(selectedFile, student?.id);

      // Update database
      await updateStudentPhotoUrl(student?.id, filePath);

      // Notify parent component
      onPhotoUpdated?.(filePath);

      // Close modal
      handleClose();
    } catch (err) {
      setError(err?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Upload Student Photo
          </h3>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={uploading}
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Maximum file size: 2MB</p>
            <p>• Allowed formats: JPEG, PNG, WebP</p>
            <p>• Recommended: Square image for best display</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <Icon name="AlertCircle" size={18} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <label className="block">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
                id="photo-upload-input"
              />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-primary/20"
                    />
                    <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Icon name="Upload" size={32} className="text-muted-foreground mx-auto" />
                    <p className="text-sm text-foreground font-medium">Click to select photo</p>
                    <p className="text-xs text-muted-foreground">or drag and drop</p>
                  </div>
                )}
              </div>
            </label>

            {selectedFile && (
              <button
                onClick={() => document.getElementById('photo-upload-input')?.click()}
                className="text-sm text-primary hover:underline"
                disabled={uploading}
              >
                Choose different photo
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-4 md:p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Photo'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;