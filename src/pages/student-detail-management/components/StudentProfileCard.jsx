import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

import { getStudentPhotoUrl } from '../../../services/storageService';
import PhotoUploadModal from './PhotoUploadModal';
import { formatDateToDDMMYYYY } from '../../../utils/dateUtils';

const StudentProfileCard = ({ student, selectedYear, onPhotoUpdated }) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Load student photo URL
  useEffect(() => {
    async function loadPhotoUrl() {
      if (student?.photoUrl) {
        setLoadingPhoto(true);
        const signedUrl = await getStudentPhotoUrl(student?.photoUrl);
        setPhotoUrl(signedUrl);
        setLoadingPhoto(false);
      } else {
        setPhotoUrl(null);
      }
    }

    loadPhotoUrl();
  }, [student?.photoUrl]);

  const handlePhotoUpdated = (newPhotoPath) => {
    onPhotoUpdated?.(newPhotoPath);
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
          <div className="flex-shrink-0 relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-lg overflow-hidden border-2 border-primary/20">
              {loadingPhoto ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={`${student?.name} profile photo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Icon name="User" size={48} className="text-muted-foreground" />
                </div>
              )}
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
              title="Upload photo"
            >
              <Icon name="Camera" size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-4 md:space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                {student?.name}
              </h2>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-caption">
                  <Icon name="Hash" size={14} />
                  {student?.admissionNumber}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs md:text-sm font-caption">
                  <Icon name="BookOpen" size={14} />
                  Class {student?.class} - {student?.section}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs md:text-sm font-caption">
                  <Icon name="Calendar" size={14} />
                  {selectedYear}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-caption">Date of Birth</p>
                <p className="text-sm md:text-base font-medium text-foreground">{formatDateToDDMMYYYY(student?.dateOfBirth)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-caption">Date of Joining</p>
                <p className="text-sm md:text-base font-medium text-foreground">{formatDateToDDMMYYYY(student?.dateOfJoining)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-caption">Attendance</p>
                <p className="text-sm md:text-base font-medium text-success">{student?.attendancePercentage}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-caption">Aadhaar Number</p>
                <p className="text-sm md:text-base font-medium text-foreground monospace">{student?.aadhaarNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-caption">Community</p>
                <p className="text-sm md:text-base font-medium text-foreground">{student?.community}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-caption">Blood Group</p>
                <p className="text-sm md:text-base font-medium text-foreground">{student?.bloodGroup}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-4">Parent Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="User" size={20} className="text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground font-caption">Father's Name</p>
                  <p className="text-sm md:text-base font-medium text-foreground">{student?.fatherName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="Phone" size={20} className="text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground font-caption">Father's Mobile</p>
                  <p className="text-sm md:text-base font-medium text-foreground monospace">{student?.fatherMobile}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="User" size={20} className="text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground font-caption">Mother's Name</p>
                  <p className="text-sm md:text-base font-medium text-foreground">{student?.motherName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="Phone" size={20} className="text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground font-caption">Mother's Mobile</p>
                  <p className="text-sm md:text-base font-medium text-foreground monospace">{student?.motherMobile}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <Icon name="MapPin" size={20} className="text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground font-caption">Address</p>
              <p className="text-sm md:text-base font-medium text-foreground">{student?.address}</p>
            </div>
          </div>
        </div>
      </div>

      <PhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        student={student}
        onPhotoUpdated={handlePhotoUpdated}
      />
    </>
  );
};

export default StudentProfileCard;