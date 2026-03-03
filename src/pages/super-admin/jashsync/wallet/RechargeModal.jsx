import React, { useState } from 'react';
import { 
    CreditCard, Wallet, IndianRupee, Gift, Check, ChevronRight,
    Smartphone, Building, QrCode, Star, Shield, Zap, Loader2,
    ArrowLeft, Copy, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * RechargeModal - Multi-step wallet recharge flow
 * Package selection → Payment method → Processing → Success
 */
const RechargeModal = ({ 
    open, 
    onOpenChange,
    selectedPackage = null,
    onSuccess 
}) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1); // 1: Package, 2: Payment, 3: Processing, 4: Success
    const [selectedPkg, setSelectedPkg] = useState(selectedPackage);
    const [customAmount, setCustomAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [upiId, setUpiId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [transactionId, setTransactionId] = useState(null);
    
    // Recharge packages
    const packages = [
        { id: 1, amount: 500, messages: 5000, bonus: 0, popular: false },
        { id: 2, amount: 1000, messages: 10000, bonus: 500, popular: false },
        { id: 3, amount: 2000, messages: 20000, bonus: 2000, popular: true },
        { id: 4, amount: 5000, messages: 50000, bonus: 5000, popular: false },
        { id: 5, amount: 10000, messages: 100000, bonus: 15000, popular: false },
    ];
    
    // Payment methods
    const paymentMethods = [
        { id: 'upi', label: 'UPI', icon: QrCode, description: 'Pay via any UPI app', popular: true },
        { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
        { id: 'netbanking', label: 'Net Banking', icon: Building, description: 'All major banks supported' },
        { id: 'wallet', label: 'Wallets', icon: Wallet, description: 'Paytm, PhonePe, GPay' },
    ];
    
    // Calculate total with bonus
    const calculateTotal = () => {
        const amount = selectedPkg?.amount || parseInt(customAmount) || 0;
        const pkg = packages.find(p => p.amount === amount);
        const bonus = pkg?.bonus || 0;
        const messages = pkg?.messages || Math.floor(amount / 0.10);
        return { amount, bonus, messages: messages + (bonus / 0.10), totalCredits: amount + bonus };
    };
    
    // Handle package selection
    const handlePackageSelect = (pkg) => {
        setSelectedPkg(pkg);
        setCustomAmount('');
    };
    
    // Handle custom amount
    const handleCustomAmount = (value) => {
        setCustomAmount(value);
        setSelectedPkg(null);
    };
    
    // Proceed to next step
    const nextStep = () => {
        if (step === 1) {
            const total = calculateTotal();
            if (total.amount < 100) {
                toast({ title: "Error", description: 'Minimum recharge amount is ₹100', variant: "destructive" });
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (paymentMethod === 'upi' && !upiId.includes('@')) {
                toast({ title: "Error", description: 'Please enter a valid UPI ID', variant: "destructive" });
                return;
            }
            processPayment();
        }
    };
    
    // Process payment
    const processPayment = async () => {
        setStep(3);
        setProcessing(true);
        
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate transaction ID
            const txId = 'TXN' + Date.now().toString(36).toUpperCase();
            setTransactionId(txId);
            
            // Success
            setStep(4);
            onSuccess?.();
            
        } catch (error) {
            console.error('Payment failed:', error);
            toast({ title: "Error", description: 'Payment failed. Please try again.', variant: "destructive" });
            setStep(2);
        } finally {
            setProcessing(false);
        }
    };
    
    // Reset and close
    const handleClose = () => {
        setStep(1);
        setSelectedPkg(selectedPackage);
        setCustomAmount('');
        setPaymentMethod('upi');
        setUpiId('');
        setTransactionId(null);
        onOpenChange(false);
    };
    
    // Copy transaction ID
    const copyTxId = () => {
        if (transactionId) {
            navigator.clipboard.writeText(transactionId);
            toast({ title: "Success", description: 'Transaction ID copied' });
        }
    };
    
    const total = calculateTotal();
    
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-lg p-0">
                {/* Header */}
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        {step > 1 && step < 4 && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setStep(s => s - 1)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">
                                {step === 1 && 'Select Package'}
                                {step === 2 && 'Payment Method'}
                                {step === 3 && 'Processing...'}
                                {step === 4 && 'Payment Successful!'}
                            </DialogTitle>
                            <DialogDescription>
                                {step === 1 && 'Choose amount to recharge'}
                                {step === 2 && 'Select how you want to pay'}
                                {step === 3 && 'Please wait while we process'}
                                {step === 4 && 'Your wallet has been recharged'}
                            </DialogDescription>
                        </div>
                    </div>
                    
                    {/* Progress Steps */}
                    {step < 4 && (
                        <div className="flex items-center gap-2 mt-4">
                            {[1, 2, 3].map((s) => (
                                <div 
                                    key={s}
                                    className={cn(
                                        "flex-1 h-1 rounded-full transition-all",
                                            s <= step ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-700"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </DialogHeader>
                
                <div className="p-4">
                    {/* Step 1: Package Selection */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Packages Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        onClick={() => handlePackageSelect(pkg)}
                                        className={cn(
                                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            "hover:border-purple-500/50",
                                            selectedPkg?.id === pkg.id 
                                                ? "border-purple-500 bg-purple-500/10" 
                                                : "border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50"
                                        )}
                                    >
                                        {pkg.popular && (
                                            <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-[10px]">
                                                <Star className="h-3 w-3 mr-1" />
                                                Best Value
                                            </Badge>
                                        )}
                                        
                                        {selectedPkg?.id === pkg.id && (
                                            <div className="absolute top-2 left-2">
                                                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{pkg.amount}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {(pkg.messages / 1000).toFixed(0)}K messages
                                            </div>
                                            {pkg.bonus > 0 && (
                                                <div className="mt-2 text-xs text-green-400 flex items-center justify-center gap-1">
                                                    <Gift className="h-3 w-3" />
                                                    +₹{pkg.bonus} bonus
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Custom Amount */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-2 bg-white dark:bg-gray-900 text-xs text-gray-500">or enter custom amount</span>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="number"
                                    placeholder="Enter amount (min ₹100)"
                                    value={customAmount}
                                    onChange={(e) => handleCustomAmount(e.target.value)}
                                    className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    min={100}
                                />
                            </div>
                            
                            {/* Summary */}
                            {total.amount > 0 && (
                                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Amount</span>
                                        <span className="text-white">₹{total.amount}</span>
                                    </div>
                                    {total.bonus > 0 && (
                                        <div className="flex items-center justify-between text-sm mt-2">
                                            <span className="text-green-400 flex items-center gap-1">
                                                <Gift className="h-3 w-3" />
                                                Bonus
                                            </span>
                                            <span className="text-green-400">+₹{total.bonus}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-700 my-2" />
                                    <div className="flex items-center justify-between font-medium">
                                        <span className="text-white">Total Credits</span>
                                        <span className="text-purple-400">₹{total.totalCredits}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 text-right">
                                        ~{Math.floor(total.messages).toLocaleString()} messages
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Step 2: Payment Method */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                {paymentMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                                            paymentMethod === method.id 
                                                ? "border-purple-500 bg-purple-500/10" 
                                                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                                        )}
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        <RadioGroupItem value={method.id} />
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            paymentMethod === method.id ? "bg-purple-500/20 text-purple-400" : "bg-gray-800 text-gray-400"
                                        )}>
                                            <method.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white">{method.label}</span>
                                                {method.popular && (
                                                    <Badge className="bg-green-500/20 text-green-400 text-[10px]">Fastest</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">{method.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </RadioGroup>
                            
                            {/* UPI ID Input */}
                            {paymentMethod === 'upi' && (
                                <div className="space-y-2">
                                    <Label className="text-sm text-gray-400">Enter UPI ID</Label>
                                    <Input
                                        placeholder="yourname@upi"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            )}
                            
                            {/* Payment Summary */}
                            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Amount to Pay</span>
                                    <span className="text-2xl font-bold text-white">₹{total.amount}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                    <Shield className="h-3 w-3 text-green-400" />
                                    <span>100% Secure Payment</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 3: Processing */}
                    {step === 3 && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
                                <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
                            <p className="text-gray-400">Please wait while we verify your payment...</p>
                            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>This may take a few seconds</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="py-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="h-10 w-10 text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
                            <p className="text-gray-400 mb-6">
                                ₹{total.totalCredits} has been added to your wallet
                            </p>
                            
                            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 text-left mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-400">Transaction ID</span>
                                    <button 
                                        onClick={copyTxId}
                                        className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                                    >
                                        <span className="font-mono">{transactionId}</span>
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-400">Amount Paid</span>
                                    <span className="text-white">₹{total.amount}</span>
                                </div>
                                {total.bonus > 0 && (
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-green-400">Bonus Added</span>
                                        <span className="text-green-400">+₹{total.bonus}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-700 my-2" />
                                <div className="flex items-center justify-between font-medium">
                                    <span className="text-white">Total Credits</span>
                                    <span className="text-purple-400">₹{total.totalCredits}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                <Zap className="h-3 w-3 text-amber-400" />
                                <span>~{Math.floor(total.messages).toLocaleString()} messages ready to send</span>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-700/50">
                    {step < 3 && (
                        <Button 
                            onClick={nextStep}
                            disabled={total.amount < 100}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            {step === 1 ? 'Continue to Payment' : 'Pay ₹' + total.amount}
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                    {step === 4 && (
                        <Button onClick={handleClose} className="w-full">
                            Done
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RechargeModal;
