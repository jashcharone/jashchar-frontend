# Billing System Analysis - Registration Types

## Current Billing Implementation

### 1. **Single School** ✅
- **Service**: `createSchoolService`
- **Billing**: 
  - One subscription per school
  - `billing_type: 'monthly'` (hardcoded - should be 'prepaid' or 'postpaid')
  - Subscription linked to `school_id`
- **Status**: ✅ Works but billing_type is wrong

### 2. **Organization** ⚠️
- **Service**: `createOrganizationService` → calls `createSchoolService`
- **Billing**:
  - Same as Single School
  - ONE subscription for entire organization
  - No per-branch billing
- **Status**: ⚠️ Works but no organization-specific pricing

### 3. **Multi-Branch Organization** ❌
- **Service**: `createOrganizationService` with `createInitialBranch: true`
- **Billing**:
  - Same as Single School
  - ONE subscription for entire organization
  - Creates initial branch but NO per-branch billing
  - No way to charge per additional branch
- **Status**: ❌ **MAJOR ISSUE** - No per-branch pricing

## Issues Found

### Critical Issues:
1. **Billing Type Mismatch**:
   - Code uses: `billing_type: 'monthly'`
   - Schema expects: `'prepaid'` or `'postpaid'`
   - ❌ This will cause database errors

2. **No Per-Branch Billing**:
   - Multi-branch organizations get ONE subscription
   - No way to charge per branch
   - No branch-level subscription tracking

3. **No Organization Pricing Model**:
   - Organizations pay same as single schools
   - No volume discounts
   - No organization-specific plans

4. **Missing Branch Subscription Table**:
   - `branches` table has `active_subscription_plan_id` column
   - But it's never used in billing logic
   - No branch-level subscriptions created

## Recommendation

### ✅ **Check "Multi-Branch Organization" Type First**

**Why?**
- Most complex billing scenario
- Has the most issues
- If this works, others will also work
- Tests per-branch billing logic

### What to Check:
1. ✅ Subscription created correctly?
2. ✅ Billing type is 'prepaid' or 'postpaid' (not 'monthly')?
3. ✅ Initial branch created?
4. ❌ Per-branch billing when adding more branches?
5. ❌ Branch subscription tracking?

## Required Fixes

### Fix 1: Correct Billing Type
```javascript
// Current (WRONG):
billing_type: 'monthly'

// Should be:
billing_type: 'prepaid' // or 'postpaid' based on plan
```

### Fix 2: Add Per-Branch Billing Logic
- Track number of branches
- Calculate per-branch pricing
- Create branch-level subscriptions or add branch count to invoice

### Fix 3: Organization Pricing Model
- Different pricing for organizations
- Volume discounts for multiple branches
- Organization-specific subscription plans

