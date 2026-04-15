# Bonterra Outcomes - Required Patterns

## 🚨 CRITICAL: Master Context Pattern

**EVERY page that displays programs, sites, participants, families, or enrollments MUST respect the master context selectors.**

### What is Master Context?
The user can select:
- **Site** (via header dropdown) - stored in `currentSiteId`
- **Program** (via header dropdown) - stored in `currentProgramId`

These selections filter ALL data across the application.

### Implementation Checklist

When creating or editing ANY page that shows data, you MUST:

1. **Import useUserStore**
```typescript
import { useUserStore } from '@/lib/stores/userStore';
```

2. **Get current context**
```typescript
const { currentProgramId, currentSiteId } = useUserStore();
```

3. **Filter data based on context**

For **programs**:
```typescript
const filteredPrograms = programs.filter((p) => {
  if (p.status !== 'active') return false;

  // If specific program selected, only show that one
  if (currentProgramId && currentProgramId !== '') {
    return p.id === currentProgramId;
  }

  // If specific site selected, only show programs for that site
  if (currentSiteId && currentSiteId !== '') {
    return p.siteIds.length === 0 || p.siteIds.includes(currentSiteId);
  }

  return true;
});
```

For **participants/families/enrollments**:
```typescript
const filteredData = data.filter((item) => {
  // Get active enrollments for this item
  const activeEnrollments = getActiveEnrollments();
  const itemEnrollments = activeEnrollments.filter(e =>
    e.participantId === item.id || e.enrolleeId === item.id
  );

  // If no enrollments, hide item when program/site filter is active
  if (itemEnrollments.length === 0 && (currentProgramId || currentSiteId)) {
    return false;
  }

  // Filter by program if selected
  if (currentProgramId && currentProgramId !== '') {
    return itemEnrollments.some(e => e.programId === currentProgramId);
  }

  // Filter by site if selected
  if (currentSiteId && currentSiteId !== '') {
    return itemEnrollments.some(e => e.siteId === currentSiteId);
  }

  return true;
});
```

### Pages That MUST Use This Pattern

- ✅ `/participants` - filters participants by program/site
- ✅ `/families` - filters families by program/site
- ✅ `/participants/create-agent` - filters available programs
- ⚠️ `/enroll` - filters enrollee lists
- ⚠️ `/case-notes` - filters participants
- ⚠️ `/services/record` - filters participants
- ⚠️ All admin pages that show programs/sites

### When NOT to Use

- Profile pages (`/participants/[id]`) - show full data once you're viewing a specific record
- Detail pages (`/families/[id]`, `/enrollments/[id]`) - same as above
- Admin configuration pages - admins need to see all data to manage it

---

## Other Critical Patterns

### Multi-Tenant Architecture
- All entities have `tenantId`
- Filter by `currentTenantId` from useUserStore
- Never show data from other tenants

### Enrollment Lifecycle
- Check enrollment status (active/completed/cancelled)
- Use `getActiveEnrollments()` helper
- Update `currentEnrollment` count on programs

### Date Handling
- Store as Date objects in stores
- Use `dateOfBirth` + `dobDataQuality` for HMIS compliance
- Support both exact DOB and approximate age

---

## How to Avoid Forgetting

1. **Check this file** before creating any new page
2. **Search for "useUserStore"** in similar pages as a template
3. **Test with master selectors** - always verify filtering works
4. **Add to code review** - check for master context usage

---

Last Updated: 2026-04-03
