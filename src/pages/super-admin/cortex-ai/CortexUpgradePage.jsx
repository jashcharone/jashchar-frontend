/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CORTEX AI UPGRADE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Landing page for organizations without Cortex AI subscription
 * Shows plans and features to encourage upgrade
 */

import React, { useState } from 'react';
import { 
    Brain, 
    Zap, 
    Star, 
    Check, 
    X, 
    ChevronRight,
    Mic,
    Camera,
    BarChart3,
    Shield,
    Users,
    TrendingUp,
    Award,
    FileText,
    Sparkles
} from 'lucide-react';
import { useCortexPlans } from '@/hooks/useCortexAccess';

const CortexUpgradePage = ({ onSelectPlan }) => {
    const { plans, loading, error } = useCortexPlans();
    const [selectedBilling, setSelectedBilling] = useState('yearly');
    const [selectedPlan, setSelectedPlan] = useState(null);

    const features = [
        {
            icon: Brain,
            title: 'AI School Brain',
            description: 'Auto-decision making ERP that thinks for you',
            color: 'text-purple-500'
        },
        {
            icon: TrendingUp,
            title: 'Profit Intelligence',
            description: 'Class-wise profit analysis & revenue forecasting',
            color: 'text-green-500'
        },
        {
            icon: Camera,
            title: 'Face Identity System',
            description: 'One photo → Full student profile with face attendance',
            color: 'text-blue-500'
        },
        {
            icon: Mic,
            title: 'Voice ERP',
            description: 'Control ERP in Kannada, Hindi & English',
            color: 'text-pink-500'
        },
        {
            icon: FileText,
            title: 'Auto Auditor',
            description: 'Government-ready compliance reports (CBSE, State, NAAC)',
            color: 'text-orange-500'
        },
        {
            icon: Users,
            title: 'Parent Emotion AI',
            description: 'Predict parent satisfaction & prevent withdrawals',
            color: 'text-red-500'
        }
    ];

    const getPlanIcon = (planKey) => {
        switch(planKey) {
            case 'starter': return '🚀';
            case 'growth': return '📈';
            case 'scale': return '⚡';
            case 'enterprise': return '🏆';
            default: return '✨';
        }
    };

    const getPrice = (plan) => {
        return selectedBilling === 'yearly' 
            ? Math.round(plan.price_yearly / 12)  // Show per month
            : plan.price_monthly;
    };

    const formatINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        if (onSelectPlan) {
            onSelectPlan(plan, selectedBilling);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
                    {/* Brain Icon with Glow */}
                    <div className="inline-flex items-center justify-center w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-2xl shadow-purple-500/50">
                        <Brain className="w-12 h-12 text-white animate-pulse" />
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text text-transparent">
                            Jashchar Cortex AI
                        </span>
                    </h1>
                    
                    <p className="text-2xl text-purple-200 mb-2">
                        India's First Thinking ERP
                    </p>
                    
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
                        Transform your school into an intelligent, self-managing institution 
                        with AI-powered automation, predictions, and insights.
                    </p>

                    {/* Banner Tags */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        <span className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm">
                            🧠 AI-Powered Analytics
                        </span>
                        <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm">
                            🗣️ Voice Commands (Kannada/Hindi)
                        </span>
                        <span className="px-4 py-2 bg-pink-500/20 border border-pink-500/50 rounded-full text-sm">
                            📸 Face Recognition
                        </span>
                        <span className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full text-sm">
                            📊 Profit Intelligence
                        </span>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold text-center mb-8">World-Exclusive AI Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <div 
                            key={idx}
                            className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
                        >
                            <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Section */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Choose Your AI Power Level</h2>
                    <p className="text-gray-400 mb-6">Select a plan based on your school size</p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center p-1 bg-white/10 rounded-full">
                        <button
                            onClick={() => setSelectedBilling('monthly')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedBilling === 'monthly'
                                    ? 'bg-purple-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setSelectedBilling('yearly')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedBilling === 'yearly'
                                    ? 'bg-purple-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Yearly
                            <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Save 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id}
                            className={`relative p-6 rounded-2xl border transition-all ${
                                plan.plan_key === 'scale'
                                    ? 'bg-gradient-to-b from-purple-900/50 to-purple-900/20 border-purple-500 shadow-xl shadow-purple-500/20'
                                    : 'bg-white/5 border-white/10 hover:border-white/30'
                            }`}
                        >
                            {plan.plan_key === 'scale' && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                                        POPULAR
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <span className="text-4xl mb-2 block">{getPlanIcon(plan.plan_key)}</span>
                                <h3 className="text-xl font-bold">{plan.plan_name.replace('Cortex AI ', '')}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {plan.min_students}-{plan.max_students === 999999 ? '∞' : plan.max_students} students
                                </p>
                            </div>

                            <div className="text-center mb-6">
                                <span className="text-4xl font-bold">{formatINR(getPrice(plan))}</span>
                                <span className="text-gray-400">/mo</span>
                                {selectedBilling === 'yearly' && (
                                    <p className="text-sm text-green-400 mt-1">
                                        Billed {formatINR(plan.price_yearly)}/year
                                    </p>
                                )}
                            </div>

                            {/* Feature Highlights */}
                            <ul className="space-y-3 mb-6 text-sm">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>AI Dashboard & Score</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    {plan.features?.profit_intelligence ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-600" />
                                    )}
                                    <span className={!plan.features?.profit_intelligence ? 'text-gray-600' : ''}>
                                        Profit Intelligence
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>
                                        {plan.features?.face_identity_limit === -1 
                                            ? 'Unlimited' 
                                            : plan.features?.face_identity_limit} faces
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>
                                        {plan.features?.voice_languages?.length || 1} voice language(s)
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    {plan.features?.parent_emotion ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-600" />
                                    )}
                                    <span className={!plan.features?.parent_emotion ? 'text-gray-600' : ''}>
                                        Parent Emotion AI
                                    </span>
                                </li>
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                                    plan.plan_key === 'scale'
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                            >
                                Select Plan
                                <ChevronRight className="w-4 h-4 inline ml-1" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Trust Badges */}
                <div className="mt-12 text-center">
                    <p className="text-gray-400 mb-4">Trusted by 500+ schools across India</p>
                    <div className="flex justify-center items-center gap-8 opacity-50">
                        <Shield className="w-8 h-8" />
                        <span className="text-sm">100% Secure Payments</span>
                        <Award className="w-8 h-8" />
                        <span className="text-sm">14-Day Free Trial</span>
                    </div>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                <div className="p-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl border border-purple-500/30">
                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Start Your 14-Day Free Trial</h3>
                    <p className="text-gray-400 mb-6">
                        Experience the power of AI in your school. No credit card required.
                    </p>
                    <button 
                        onClick={() => handleSelectPlan(plans.find(p => p.plan_key === 'growth'))}
                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-lg hover:opacity-90 transition-all"
                    >
                        Start Free Trial
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CortexUpgradePage;
