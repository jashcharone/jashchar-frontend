import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { IndianRupee, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AccountantDashboard = () => {
    const { user, school } = useAuth();
    const currencySymbol = school?.currency_symbol || '₹';

    const stats = [
        { title: 'Fees Collected Today', value: `${currencySymbol}5,20,000`, icon: IndianRupee, change: '+5.2%', changeType: 'increase' },
        { title: 'Total Due Fees', value: `${currencySymbol}85,000`, icon: Receipt, change: '-2.1%', changeType: 'decrease' },
        { title: 'Monthly Expenses', value: `${currencySymbol}1,50,000`, icon: TrendingDown, change: '+10%', changeType: 'increase' },
        { title: 'Monthly Income', value: `${currencySymbol}6,00,000`, icon: TrendingUp, change: '+8%', changeType: 'increase' },
    ];
    
    const recentTransactions = [
        { id: 1, description: 'Fees from John Doe (Adm# S101)', amount: `+ ${currencySymbol}5,000`, date: '2025-11-13' },
        { id: 2, description: 'Office Supplies (Inv# 452)', amount: `- ${currencySymbol}1,200`, date: '2025-11-12' },
        { id: 3, description: 'Fees from Jane Smith (Adm# S102)', amount: `+ ${currencySymbol}4,500`, date: '2025-11-12' },
        { id: 4, description: 'Electricity Bill', amount: `- ${currencySymbol}12,500`, date: '2025-11-11' },
    ];

    return (
        <DashboardLayout>
            <WelcomeMessage 
                user={user?.profile?.full_name || 'Accountant'}
                message={school?.name ? `Financial overview - ${school.name}` : "Here's a financial overview of your school."}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-lg border">
                <h2 className="text-xl font-bold text-foreground mb-4">Recent Transactions</h2>
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {recentTransactions.map((tx, txIdx) => (
                            <li key={tx.id}>
                                <div className="relative pb-8">
                                    {txIdx !== recentTransactions.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-card ${tx.amount.startsWith('+') ? 'bg-green-500' : 'bg-red-500'}`}>
                                                <IndianRupee className="h-5 w-5 text-white" />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-foreground">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground">{tx.date}</p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap">
                                                <p className={`font-semibold ${tx.amount.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{tx.amount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AccountantDashboard;
