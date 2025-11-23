# EventFinancialPlanning Component - UX & Data Optimization Plan

## Current State Analysis

### Component Structure
- **Size**: 1,737 lines (very large, needs splitting)
- **Tabs**: 3 tabs (Settings, Expenses, Calculations)
- **API Calls**: ~5-6 sequential calls on load
- **State Management**: 15+ useState hooks
- **Auto-calculation**: Triggers after every expense change (no debouncing)

### Current Issues

#### 1. **Performance Issues**
- ❌ Sequential API calls (blocking)
- ❌ No request deduplication
- ❌ Auto-calculation fires immediately (no debounce)
- ❌ Large component re-renders on every state change
- ❌ No memoization of expensive calculations
- ❌ No data caching strategy

#### 2. **UX Issues**
- ❌ Blocking loading states (user can't interact)
- ❌ No skeleton loaders (blank screen during load)
- ❌ No optimistic updates (feels slow)
- ❌ Error messages disappear too quickly
- ❌ No inline validation feedback
- ❌ No keyboard shortcuts
- ❌ No undo/redo for bulk operations
- ❌ Tab state not persisted (lost on refresh)
- ❌ No progress indicators for long operations

#### 3. **Data Management**
- ❌ No request cancellation (race conditions possible)
- ❌ No retry logic for failed requests
- ❌ No background refresh
- ❌ Duplicate data fetching across tabs
- ❌ No local storage for draft changes

## Proposed Improvements

### Phase 1: Data Optimization (High Impact, Low Risk)

#### 1.1 Parallel API Calls
**Current**: Sequential `await` calls
```typescript
const financialsRes = await fetch(...);
const templatesRes = await fetch(...);
const ticketsRes = await fetch(...);
```

**Improved**: Parallel execution
```typescript
const [financialsRes, templatesRes, ticketsRes] = await Promise.all([
  fetch(...),
  fetch(...),
  fetch(...)
]);
```

**Impact**: Reduces load time from ~1.5s to ~0.5s

#### 1.2 Debounced Auto-Calculation
**Current**: Immediate calculation after expense change
```typescript
await fetchData();
await handleCalculate(); // Immediate
```

**Improved**: Debounced with 500ms delay
```typescript
const debouncedCalculate = useMemo(
  () => debounce(handleCalculate, 500),
  [eventId]
);
```

**Impact**: Prevents unnecessary API calls, better UX

#### 1.3 Memoized Calculations
**Current**: Recalculates on every render
```typescript
const projectedIncome = averagePrice * capacity;
```

**Improved**: Memoized with dependencies
```typescript
const projectedIncome = useMemo(
  () => averagePrice * capacity,
  [averagePrice, capacity]
);
```

#### 1.4 Request Deduplication
**Current**: Multiple identical requests possible
**Improved**: Cache with React Query or custom hook
```typescript
const { data, isLoading } = useFinancials(eventId);
```

### Phase 2: UX Enhancements (Medium Impact, Medium Risk)

#### 2.1 Skeleton Loaders
Replace blank loading states with skeleton screens:
```tsx
{loading ? (
  <FinancialSkeleton />
) : (
  <FinancialContent />
)}
```

#### 2.2 Optimistic Updates
Update UI immediately, rollback on error:
```typescript
// Optimistic update
setExpenses([...expenses, newExpense]);

try {
  await saveExpense(newExpense);
} catch (error) {
  // Rollback
  setExpenses(prevExpenses);
  showError('Failed to save');
}
```

#### 2.3 Progressive Loading
Load critical data first, then secondary:
```typescript
// Load financials first (critical)
await fetchFinancials();

// Load templates in background (non-critical)
fetchTemplates().then(setTemplates);
```

#### 2.4 Better Error Handling
- Persistent error messages (don't auto-dismiss)
- Retry buttons
- Error boundaries
- Toast notifications for success/error

#### 2.5 Inline Validation
Real-time feedback on form fields:
```tsx
<input
  onBlur={validateField}
  className={hasError ? 'border-red-500' : ''}
/>
{error && <span className="text-red-500 text-sm">{error}</span>}
```

### Phase 3: Component Architecture (High Impact, High Risk)

#### 3.1 Split into Smaller Components
```
EventFinancialPlanning/
├── FinancialSettings/
│   ├── BasicInfoSection.tsx
│   ├── PercentagesSection.tsx
│   └── IncomeSection.tsx
├── ExpensesManagement/
│   ├── ExpenseList.tsx
│   ├── ExpenseForm.tsx
│   └── BulkExpenseForm.tsx
├── CalculationsView/
│   ├── SummaryCards.tsx
│   ├── ScenariosTable.tsx
│   └── BreakdownAccordion.tsx
└── hooks/
    ├── useFinancials.ts
    ├── useExpenses.ts
    └── useCalculations.ts
```

#### 3.2 Custom Hooks for Data Fetching
```typescript
// useFinancials.ts
export function useFinancials(eventId: string) {
  return useQuery({
    queryKey: ['financials', eventId],
    queryFn: () => fetchFinancials(eventId),
    staleTime: 30000, // 30 seconds
  });
}
```

#### 3.3 Context for Shared State
```typescript
const FinancialContext = createContext();

export function FinancialProvider({ eventId, children }) {
  const financials = useFinancials(eventId);
  const expenses = useExpenses(eventId);
  const calculations = useCalculations(eventId);
  
  return (
    <FinancialContext.Provider value={{ financials, expenses, calculations }}>
      {children}
    </FinancialContext.Provider>
  );
}
```

### Phase 4: Advanced Features (Low Priority)

#### 4.1 Keyboard Shortcuts
- `Ctrl+S` - Save financials
- `Ctrl+C` - Calculate
- `Ctrl+E` - Add expense
- `Esc` - Close modals

#### 4.2 Local Storage Drafts
Save form state to localStorage:
```typescript
useEffect(() => {
  localStorage.setItem(`financials-draft-${eventId}`, JSON.stringify(financialsForm));
}, [financialsForm]);
```

#### 4.3 Tab State Persistence
Save active tab to URL or localStorage:
```typescript
const [activeTab, setActiveTab] = useSearchParams('tab', 'settings');
```

#### 4.4 Undo/Redo for Bulk Operations
```typescript
const history = useHistory(expenses);
// After bulk save
history.push(expenses);
// Undo
history.undo();
```

#### 4.5 Export Options
- PDF export
- Excel export
- Print-friendly view
- Shareable link

## Implementation Priority

### 🔴 Critical (Do First)
1. Parallel API calls
2. Debounced auto-calculation
3. Skeleton loaders
4. Better error handling

### 🟡 High Priority (Do Next)
5. Component splitting
6. Custom hooks for data fetching
7. Optimistic updates
8. Memoized calculations

### 🟢 Medium Priority (Nice to Have)
9. Inline validation
10. Keyboard shortcuts
11. Local storage drafts
12. Tab state persistence

### ⚪ Low Priority (Future)
13. Undo/redo
14. Advanced export options
15. Context API refactor

## Metrics to Track

### Performance
- Initial load time (target: <1s)
- Time to interactive (target: <1.5s)
- API call count (target: <3 on load)
- Re-render count (target: <5 per user action)

### UX
- Error rate (target: <1%)
- User task completion rate (target: >95%)
- Average time to add expense (target: <10s)
- User satisfaction score

## Risk Assessment

### Low Risk
- Parallel API calls
- Debouncing
- Memoization
- Skeleton loaders

### Medium Risk
- Component splitting (requires testing)
- Custom hooks (needs careful dependency management)
- Optimistic updates (rollback logic complexity)

### High Risk
- Context API refactor (large refactor)
- Undo/redo (complex state management)

## Next Steps

1. **Start with Phase 1** (Data Optimization)
   - Implement parallel API calls
   - Add debouncing
   - Add memoization
   - Measure performance improvements

2. **Then Phase 2** (UX Enhancements)
   - Add skeleton loaders
   - Implement optimistic updates
   - Improve error handling

3. **Finally Phase 3** (Architecture)
   - Split components gradually
   - Extract custom hooks
   - Refactor incrementally

## Questions for Discussion

1. **Data Fetching Strategy**: Should we use React Query/SWR or custom hooks?
2. **State Management**: Is Context API needed or are hooks sufficient?
3. **Component Size**: Should we split now or optimize first?
4. **Backward Compatibility**: Do we need to maintain current API structure?
5. **Testing Strategy**: What level of testing is needed for refactoring?

