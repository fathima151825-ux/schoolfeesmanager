import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { searchPayments } from '../../../services/paymentService';

const TransactionSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const paymentMethodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'online', label: 'Online' }
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchPayments({ searchTerm, dateFrom, dateTo, paymentMethod });
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = () => {
    alert(`Exporting ${searchResults?.length} transactions to Excel`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPaymentMethod('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Icon name="Search" size={20} className="text-primary" />
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Transaction Search
        </h2>
      </div>
      <div className="space-y-4 mb-4 md:mb-6">
        <Input
          type="text"
          label="Search"
          placeholder="Receipt number, student name, or admission number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e?.target?.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e?.target?.value)}
          />
        </div>

        <Select
          label="Payment Method"
          options={paymentMethodOptions}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />

        <div className="flex flex-col md:flex-row gap-3">
          <Button
            variant="default"
            iconName="Search"
            iconPosition="left"
            onClick={handleSearch}
            loading={isSearching}
            fullWidth
          >
            Search Transactions
          </Button>
          <Button
            variant="outline"
            iconName="X"
            iconPosition="left"
            onClick={handleClearFilters}
            className="w-full md:w-auto"
          >
            Clear
          </Button>
        </div>
      </div>
      {searchResults?.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Found {searchResults?.length} transaction{searchResults?.length !== 1 ? 's' : ''}
            </p>
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={handleExport}
            >
              Export
            </Button>
          </div>

          <div className="space-y-2 max-h-64 md:max-h-80 overflow-y-auto">
            {searchResults?.map((transaction) => (
              <div
                key={transaction?.id}
                className="p-3 md:p-4 bg-muted rounded-lg border border-border hover:border-primary/30 transition-all duration-250"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                        {transaction?.students?.name || transaction?.studentName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                        transaction?.paymentMethod === 'cash' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}>
                        {transaction?.paymentMethod?.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span className="data-text">{transaction?.receiptNumber}</span>
                      <span>{transaction?.students?.admissionNumber || transaction?.admissionNumber}</span>
                      <span>{transaction?.paymentDate ? new Date(transaction.paymentDate)?.toLocaleDateString('en-IN') : ''}</span>
                      <span>{transaction?.term}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-base md:text-lg font-bold text-primary data-text">
                      ₹{parseFloat(transaction?.amount || 0)?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {hasSearched && searchResults?.length === 0 && !isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Search" size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm md:text-base">No transactions found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default TransactionSearch;