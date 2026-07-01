import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { searchStudents } from '../../../services/studentService';

const StudentLookup = ({ onStudentSelect, academicYearId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm?.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setShowSuccessFeedback(false);
    
    try {
      const results = await searchStudents(searchTerm, academicYearId);
      console.log('Search results:', results);
      setSearchResults(results || []);
      
      // Show success feedback if results found
      if (results && results?.length > 0) {
        setShowSuccessFeedback(true);
        setTimeout(() => {
          setShowSuccessFeedback(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e) => {
    const value = e?.target?.value || '';
    setSearchTerm(value);
    if (!value?.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Icon name="Search" size={20} className="text-primary" />
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Student Lookup
        </h2>
      </div>
      {/* Success Feedback */}
      {showSuccessFeedback && (
        <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Icon name="CheckCircle2" size={20} className="text-success" />
          <p className="text-sm text-success font-medium">
            Found {searchResults?.length} student{searchResults?.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3 mb-4">
        <div className="w-full">
          <Input
            type="text"
            placeholder="Search by Admission Number, Name, or Mobile"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            autoComplete="off"
            aria-label="Search students"
          />
        </div>
        <Button
          variant="default"
          iconName="Search"
          iconPosition="left"
          onClick={handleSearch}
          loading={isSearching}
          disabled={!searchTerm?.trim()}
          className="w-full min-h-[48px] text-base"
        >
          Search Student
        </Button>
      </div>
      {isSearching && (
        <div className="text-center py-8">
          <Icon name="Loader2" size={32} className="mx-auto mb-2 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Searching students...</p>
        </div>
      )}
      {!isSearching && searchResults?.length > 0 && (
        <div className="space-y-2 max-h-64 md:max-h-80 overflow-y-auto">
          {searchResults?.map((student) => (
            <div
              key={student?.id}
              onClick={() => onStudentSelect(student)}
              className="p-3 md:p-4 bg-muted rounded-lg border border-border hover:border-primary hover:shadow-warm cursor-pointer transition-all duration-250"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                      {student?.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded whitespace-nowrap">
                      {student?.admissionNumber}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="GraduationCap" size={14} />
                      Class {student?.class}-{student?.section}
                    </span>
                    {student?.mobile && (
                      <span className="flex items-center gap-1">
                        <Icon name="Phone" size={14} />
                        {student?.mobile}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={`text-sm md:text-base font-semibold data-text ${student?.balance > 0 ? 'text-error' : 'text-success'}`}>
                      ₹{student?.balance?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isSearching && hasSearched && searchResults?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Search" size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm md:text-base font-medium mb-1">No students found</p>
          <p className="text-xs">Try searching with a different admission number, name, or mobile number</p>
        </div>
      )}
    </div>
  );
};

export default StudentLookup;