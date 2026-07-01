import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PaymentGatewayModal = ({ isOpen, amount, onSuccess, onCancel }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setCardNumber('');
      setCardName('');
      setExpiryDate('');
      setCvv('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!cardNumber || cardNumber?.replace(/\s/g, '')?.length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!cardName || cardName?.trim()?.length < 3) {
      newErrors.cardName = 'Please enter cardholder name';
    }

    if (!expiryDate || !/^\d{2}\/\d{2}$/?.test(expiryDate)) {
      newErrors.expiryDate = 'Please enter valid expiry date (MM/YY)';
    }

    if (!cvv || cvv?.length !== 3) {
      newErrors.cvv = 'Please enter valid 3-digit CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleCardNumberChange = (value) => {
    const cleaned = value?.replace(/\s/g, '');
    const formatted = cleaned?.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted?.slice(0, 19));
  };

  const handleExpiryChange = (value) => {
    const cleaned = value?.replace(/\D/g, '');
    if (cleaned?.length >= 2) {
      setExpiryDate(`${cleaned?.slice(0, 2)}/${cleaned?.slice(2, 4)}`);
    } else {
      setExpiryDate(cleaned);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      onSuccess({
        transactionId,
        amount,
        date: new Date()?.toISOString(),
        method: 'Online Payment',
        cardLast4: cardNumber?.slice(-4)
      });
      setProcessing(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-warm-xl max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="CreditCard" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-heading font-bold text-foreground">
                Payment Gateway
              </h2>
              <p className="text-sm text-muted-foreground font-caption">
                Secure payment processing
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-caption">Amount to Pay</span>
            <span className="text-2xl font-heading font-bold text-primary data-text">
              ₹{amount?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Card Number"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => handleCardNumberChange(e?.target?.value)}
            error={errors?.cardNumber}
            required
          />

          <Input
            label="Cardholder Name"
            type="text"
            placeholder="Name as on card"
            value={cardName}
            onChange={(e) => setCardName(e?.target?.value)}
            error={errors?.cardName}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              type="text"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={(e) => handleExpiryChange(e?.target?.value)}
              error={errors?.expiryDate}
              required
            />

            <Input
              label="CVV"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e?.target?.value?.replace(/\D/g, '')?.slice(0, 3))}
              error={errors?.cvv}
              required
            />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 mt-4">
            <Icon name="Shield" size={16} className="text-success mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground font-caption">
              Your payment information is encrypted and secure. We do not store your card details.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={onCancel}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="lg"
              fullWidth
              loading={processing}
              iconName="Lock"
              iconPosition="left"
            >
              Pay Now
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <Icon name="Shield" size={16} />
            <span className="text-xs font-caption">256-bit SSL Encrypted</span>
            <Icon name="Lock" size={16} />
            <span className="text-xs font-caption">PCI DSS Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;