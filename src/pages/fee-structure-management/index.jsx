import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import { getFeeCategories, getAllClassFeeStructures, getClasses } from '../../services/feeService';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import FeeStructureEditor from './components/FeeStructureEditor';
import BulkFeeUploadModal from './components/BulkFeeUploadModal';

const FeeStructureManagement = () => {
  const navigate = useNavigate();
  const { currentAcademicYear, academicYears, loading: yearLoading } = useAcademicYear();
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);
  const [existingData, setExistingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Set default year to current when context loads
  useEffect(() => {
    if (!yearLoading) {
      if (currentAcademicYear?.id) {
        setSelectedYearId(currentAcademicYear?.id);
      } else if (academicYears?.length > 0) {
        setSelectedYearId(academicYears?.[0]?.id);
      }
    }
  }, [yearLoading, currentAcademicYear?.id]);

  // Load fee categories and classes on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [cats, classList] = await Promise.all([
          getFeeCategories(),
          getClasses()
        ]);
        setFeeCategories(cats || []);
        setClasses(classList || []);
        // Default to first class
        if (classList?.length > 0 && !selectedClassId) {
          setSelectedClassId(classList?.[0]?.id);
        }
      } catch (err) {
        setError('Failed to load fee categories or classes. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Load existing fee structure when class or year changes
  useEffect(() => {
    if (!selectedYearId || !selectedClassId) return;
    const load = async () => {
      setDataLoading(true);
      try {
        const data = await getAllClassFeeStructures(selectedYearId);
        const classData = data?.filter(d => (d?.classId || d?.class_id) === selectedClassId);
        setExistingData(classData || []);
      } catch (err) {
        setExistingData([]);
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [selectedYearId, selectedClassId, refreshKey]);

  const handleSaved = () => setRefreshKey(k => k + 1);
  const handleBulkUploaded = () => setRefreshKey(k => k + 1);

  const selectedYear = academicYears?.find(y => y?.id === selectedYearId);
  const selectedYearName = selectedYear?.yearName || selectedYear?.year_name || 'Select Year';
  const isCurrentYear = selectedYear?.isCurrent || selectedYear?.is_current;
  const selectedClass = classes?.find(c => c?.id === selectedClassId);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebarNavigation />
      <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <Icon name="ArrowLeft" size={20} className="text-muted-foreground" />
              </button>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                Fee Structure Management
              </h1>
            </div>
            {!loading && !error && (
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <Icon name="Upload" size={16} />
                <span className="hidden sm:inline">Bulk Upload</span>
                <span className="sm:hidden">Upload</span>
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-caption ml-10">
            Set fee amounts per class for each academic year and term. Each year has its own independent fee structure.
          </p>
        </div>

        {loading || yearLoading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">{error}</div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Academic Year</label>
                  <select
                    value={selectedYearId}
                    onChange={e => setSelectedYearId(e?.target?.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {academicYears?.map(y => (
                      <option key={y?.id} value={y?.id}>
                        {y?.yearName || y?.year_name} {(y?.isCurrent || y?.is_current) ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                  {isCurrentYear && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Icon name="CheckCircle" size={12} />
                      This is the current active year — students will see these fees
                    </p>
                  )}
                </div>
                {/* Class — now uses UUID from classes master table */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Class</label>
                  <div className="flex flex-wrap gap-2">
                    {classes?.map(cls => (
                      <button
                        key={cls?.id}
                        onClick={() => setSelectedClassId(cls?.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          selectedClassId === cls?.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {cls?.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Structure Editor */}
            {selectedClassId && selectedYearId && (
              <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="IndianRupee" size={20} className="text-primary" />
                  <h2 className="text-lg font-heading font-semibold text-foreground">
                    {selectedClass?.displayName || selectedClass?.display_name || `Class ${selectedClass?.name}`} — {selectedYearName}
                  </h2>
                </div>
                {dataLoading ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                    <Icon name="Loader2" size={20} className="animate-spin" />
                    <span className="text-sm">Loading fee structure…</span>
                  </div>
                ) : (
                  <FeeStructureEditor
                    classId={selectedClassId}
                    className={selectedClass?.name}
                    academicYearId={selectedYearId}
                    feeCategories={feeCategories}
                    existingData={existingData}
                    onSaved={handleSaved}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showBulkUpload && (
        <BulkFeeUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onUploaded={handleBulkUploaded}
          academicYearId={selectedYearId}
          feeCategories={feeCategories}
          classes={classes}
        />
      )}
    </div>
  );
};

export default FeeStructureManagement;
