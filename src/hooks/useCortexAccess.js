/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE CORTEX ACCESS HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 * Check if the current organization has an active Cortex AI subscription
 * This is separate from regular module permissions - it's Add-on billing based
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook to check Cortex AI access for the current organization
 * @returns {Object} Access information
 */
export const useCortexAccess = () => {
    const { user, organizationId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [access, setAccess] = useState({
        hasAccess: false,
        plan: null,
        planName: null,
        features: {},
        expiresAt: null,
        daysRemaining: null,
        isTrialActive: false,
        subscription: null
    });

    const checkAccess = useCallback(async () => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Query the subscription with plan details
            // Using .maybeSingle() to avoid PGRST116 error when no subscription exists
            const { data: subscription, error: subError } = await supabase
                .from('cortex_addon_subscriptions')
                .select(`
                    *,
                    cortex_addon_plans (
                        plan_key,
                        plan_name,
                        features,
                        price_monthly,
                        price_yearly
                    )
                `)
                .eq('organization_id', organizationId)
                .in('status', ['active', 'trial'])
                .maybeSingle();

            if (subError) {
                throw subError;
            }

            if (!subscription) {
                setAccess({
                    hasAccess: false,
                    plan: null,
                    planName: null,
                    features: {},
                    expiresAt: null,
                    daysRemaining: null,
                    isTrialActive: false,
                    subscription: null
                });
                return;
            }

            // Check if subscription is still valid
            const endDate = new Date(subscription.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isValid = endDate >= today;
            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            const isTrialActive = subscription.status === 'trial' && 
                subscription.trial_end_date && 
                new Date(subscription.trial_end_date) >= today;

            setAccess({
                hasAccess: isValid,
                plan: subscription.cortex_addon_plans?.plan_key || null,
                planName: subscription.cortex_addon_plans?.plan_name || null,
                features: subscription.cortex_addon_plans?.features || {},
                expiresAt: subscription.end_date,
                daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
                isTrialActive,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    billingCycle: subscription.billing_cycle,
                    autoRenew: subscription.auto_renew,
                    startDate: subscription.start_date,
                    endDate: subscription.end_date
                }
            });

        } catch (err) {
            console.error('Error checking Cortex access:', err);
            setError(err.message);
            setAccess({
                hasAccess: false,
                plan: null,
                planName: null,
                features: {},
                expiresAt: null,
                daysRemaining: null,
                isTrialActive: false,
                subscription: null
            });
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        checkAccess();
    }, [checkAccess]);

    // Helper function to check specific feature
    const hasFeature = useCallback((featureKey) => {
        if (!access.hasAccess || !access.features) return false;
        const value = access.features[featureKey];
        if (value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0; // -1 means unlimited
        if (Array.isArray(value)) return value.length > 0;
        return !!value;
    }, [access.hasAccess, access.features]);

    // Helper to check feature limit
    const getFeatureLimit = useCallback((featureKey) => {
        if (!access.hasAccess || !access.features) return 0;
        const value = access.features[featureKey];
        if (typeof value === 'number') return value === -1 ? Infinity : value;
        return 0;
    }, [access.hasAccess, access.features]);

    // Check if specific language is supported for voice
    const hasVoiceLanguage = useCallback((langCode) => {
        if (!access.hasAccess || !access.features) return false;
        const languages = access.features.voice_languages || [];
        return languages.includes(langCode);
    }, [access.hasAccess, access.features]);

    return {
        ...access,
        loading,
        error,
        refresh: checkAccess,
        hasFeature,
        getFeatureLimit,
        hasVoiceLanguage
    };
};

/**
 * Hook to get available Cortex AI plans for purchase
 * @returns {Object} Plans data
 */
export const useCortexPlans = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('cortex_addon_plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });

                if (fetchError) throw fetchError;
                setPlans(data || []);
            } catch (err) {
                console.error('Error fetching Cortex plans:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    return { plans, loading, error };
};

/**
 * Hook to get Cortex usage statistics for current organization
 * @returns {Object} Usage data
 */
export const useCortexUsage = () => {
    const { organizationId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState(null);

    useEffect(() => {
        const fetchUsage = async () => {
            if (!organizationId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const today = new Date().toISOString().split('T')[0];
                
                const { data, error } = await supabase
                    .from('cortex_addon_usage')
                    .select('*')
                    .eq('organization_id', organizationId)
                    .eq('usage_date', today)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                setUsage(data || {
                    alerts_count: 0,
                    suggestions_count: 0,
                    face_scans_count: 0,
                    voice_commands_count: 0,
                    api_calls_count: 0
                });
            } catch (err) {
                console.error('Error fetching Cortex usage:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, [organizationId]);

    return { usage, loading };
};

export default useCortexAccess;
