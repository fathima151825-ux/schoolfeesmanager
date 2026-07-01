import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import { getStudentPhotoUrl } from '../../../services/storageService';
import { formatDateToDDMMYYYY } from '../../../utils/dateUtils';

const StudentProfileCard = ({ student }) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

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

  return (
    <div className="bg-card rounded-xl shadow-warm-md p-4 md:p-6 lg:p-8 border border-border">
      <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
          {loadingPhoto ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${student?.name} profile photo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Icon name="User" size={24} className="text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-1">
            {student?.name}
          </h2>
          <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground font-caption">
            <span className="flex items-center gap-1">
              <Icon name="Hash" size={14} />
              {student?.admissionNumber}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="GraduationCap" size={14} />
              Class {student?.class} - {student?.section}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="space-y-1">
          <p className="text-xs md:text-sm text-muted-foreground font-caption">Date of Joining</p>
          <p className="text-sm md:text-base font-medium text-foreground">{formatDateToDDMMYYYY(student?.dateOfJoining)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs md:text-sm text-muted-foreground font-caption">Attendance</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${student?.attendance}%` }}
              />
            </div>
            <span className="text-sm md:text-base font-medium text-foreground whitespace-nowrap">
              {student?.attendance}%
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs md:text-sm text-muted-foreground font-caption">Community</p>
          <p className="text-sm md:text-base font-medium text-foreground">{student?.community}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs md:text-sm text-muted-foreground font-caption">Aadhaar Number</p>
          <p className="text-sm md:text-base font-medium text-foreground data-text">
            {student?.aadhaarNumber}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileCard;