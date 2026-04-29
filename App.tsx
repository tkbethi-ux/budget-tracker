import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type BudgetMode = 'biweekly' | 'monthly';
type StoreCategory =
  | 'Groceries'
  | 'Household'
  | 'Fuel'
  | 'Dining'
  | 'Health'
  | 'Other';
type TabKey = 'budget' | 'stores' | 'grocery' | 'reports';

type Store = {
  id: number;
  name: string;
  category: StoreCategory;
  amount: number;
  visits: number;
  favorite: boolean;
  mine: boolean;
};

type StoreForm = Omit<Store, 'amount' | 'visits'> & {
  amount: string;
  visits: string;
};

type GroceryItem = {
  id: number;
  name: string;
  estimatedCost: number;
  quantity: number;
  checked: boolean;
};

type Totals = {
  spent: number;
  visits: number;
  activeBudget: number;
  remaining: number;
  groceryPlanned: number;
  groceryRemaining: number;
  projectedRemaining: number;
  savingsTarget: number;
  savingsReady: number;
};

type PersistedBudgetState = {
  budgetMode: BudgetMode;
  biweeklyBudget: string;
  monthlyBudget: string;
  savingsGoal: string;
  stores: Store[];
  groceryItems: GroceryItem[];
};

const STORAGE_KEY = '@budget_tracker_state_v2';

const categories: StoreCategory[] = [
  'Groceries',
  'Household',
  'Fuel',
  'Dining',
  'Health',
  'Other',
];

const initialBudgetState: PersistedBudgetState = {
  budgetMode: 'biweekly',
  biweeklyBudget: '',
  monthlyBudget: '',
  savingsGoal: '',
  stores: [],
  groceryItems: [],
};

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function toMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

function toNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSavedState(
  savedState: Partial<PersistedBudgetState>,
): PersistedBudgetState {
  return {
    budgetMode:
      savedState.budgetMode === 'monthly' ||
      savedState.budgetMode === 'biweekly'
        ? savedState.budgetMode
        : initialBudgetState.budgetMode,
    biweeklyBudget:
      typeof savedState.biweeklyBudget === 'string'
        ? savedState.biweeklyBudget
        : initialBudgetState.biweeklyBudget,
    monthlyBudget:
      typeof savedState.monthlyBudget === 'string'
        ? savedState.monthlyBudget
        : initialBudgetState.monthlyBudget,
    savingsGoal:
      typeof savedState.savingsGoal === 'string'
        ? savedState.savingsGoal
        : initialBudgetState.savingsGoal,
    stores: Array.isArray(savedState.stores)
      ? savedState.stores
      : initialBudgetState.stores,
    groceryItems: Array.isArray(savedState.groceryItems)
      ? savedState.groceryItems
      : initialBudgetState.groceryItems,
  };
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <BudgetTrackerApp />
    </SafeAreaProvider>
  );
}

function BudgetTrackerApp() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('stores');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(
    initialBudgetState.budgetMode,
  );
  const [biweeklyBudget, setBiweeklyBudget] = useState(
    initialBudgetState.biweeklyBudget,
  );
  const [monthlyBudget, setMonthlyBudget] = useState(
    initialBudgetState.monthlyBudget,
  );
  const [savingsGoal, setSavingsGoal] = useState(
    initialBudgetState.savingsGoal,
  );
  const [stores, setStores] = useState<Store[]>(initialBudgetState.stores);
  const [groceryItems, setGroceryItems] =
    useState<GroceryItem[]>(initialBudgetState.groceryItems);
  const [hasLoadedSavedState, setHasLoadedSavedState] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [storeForm, setStoreForm] = useState<StoreForm>({
    id: 0,
    name: '',
    category: 'Groceries' as StoreCategory,
    amount: '',
    visits: '1',
    favorite: false,
    mine: true,
  });
  const [groceryForm, setGroceryForm] = useState({
    name: '',
    estimatedCost: '',
    quantity: '1',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSavedState() {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (savedState) {
          const normalizedState = normalizeSavedState(JSON.parse(savedState));

          setBudgetMode(normalizedState.budgetMode);
          setBiweeklyBudget(normalizedState.biweeklyBudget);
          setMonthlyBudget(normalizedState.monthlyBudget);
          setSavingsGoal(normalizedState.savingsGoal);
          setStores(normalizedState.stores);
          setGroceryItems(normalizedState.groceryItems);
        }

        setStorageError('');
      } catch {
        if (isMounted) {
          setStorageError('Saved data could not be loaded on this device.');
        }
      } finally {
        if (isMounted) {
          setHasLoadedSavedState(true);
        }
      }
    }

    loadSavedState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedState) {
      return;
    }

    const nextState: PersistedBudgetState = {
      budgetMode,
      biweeklyBudget,
      monthlyBudget,
      savingsGoal,
      stores,
      groceryItems,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
      .then(() => setStorageError(''))
      .catch(() => {
        setStorageError('Changes could not be saved on this device.');
      });
  }, [
    biweeklyBudget,
    budgetMode,
    groceryItems,
    hasLoadedSavedState,
    monthlyBudget,
    savingsGoal,
    stores,
  ]);

  const totals = useMemo(() => {
    const spent = stores.reduce((sum, store) => sum + store.amount, 0);
    const visits = stores.reduce((sum, store) => sum + store.visits, 0);
    const activeBudget =
      budgetMode === 'biweekly'
        ? toNumber(biweeklyBudget)
        : toNumber(monthlyBudget);
    const groceryPlanned = groceryItems.reduce(
      (sum, item) => sum + item.estimatedCost * item.quantity,
      0,
    );
    const groceryRemaining = groceryItems
      .filter(item => !item.checked)
      .reduce((sum, item) => sum + item.estimatedCost * item.quantity, 0);
    const remaining = activeBudget - spent;
    const projectedRemaining = activeBudget - spent - groceryRemaining;
    const savingsTarget = toNumber(savingsGoal);
    const savingsReady = Math.max(0, remaining - savingsTarget);

    return {
      spent,
      visits,
      activeBudget,
      remaining,
      groceryPlanned,
      groceryRemaining,
      projectedRemaining,
      savingsTarget,
      savingsReady,
    };
  }, [biweeklyBudget, budgetMode, groceryItems, monthlyBudget, savingsGoal, stores]);

  const sortedStores = useMemo(
    () =>
      [...stores].sort((a, b) => {
        if (Number(b.favorite) !== Number(a.favorite)) {
          return Number(b.favorite) - Number(a.favorite);
        }
        return b.visits - a.visits;
      }),
    [stores],
  );

  const categoryTotals = useMemo(
    () =>
      categories.map(category => ({
        category,
        amount: stores
          .filter(store => store.category === category)
          .reduce((sum, store) => sum + store.amount, 0),
        visits: stores
          .filter(store => store.category === category)
          .reduce((sum, store) => sum + store.visits, 0),
      })),
    [stores],
  );

  function resetStoreForm() {
    setStoreForm({
      id: 0,
      name: '',
      category: 'Groceries',
      amount: '',
      visits: '1',
      favorite: false,
      mine: true,
    });
  }

  function saveStore() {
    const trimmedName = storeForm.name.trim();

    if (!trimmedName) {
      return;
    }

    const nextStore: Store = {
      id: storeForm.id || Date.now(),
      name: trimmedName,
      category: storeForm.category,
      amount: toNumber(storeForm.amount),
      visits: Math.max(0, Math.round(toNumber(storeForm.visits))),
      favorite: storeForm.favorite,
      mine: storeForm.mine,
    };

    setStores(currentStores => {
      const exists = currentStores.some(store => store.id === nextStore.id);

      if (exists) {
        return currentStores.map(store =>
          store.id === nextStore.id ? nextStore : store,
        );
      }

      return [nextStore, ...currentStores];
    });
    resetStoreForm();
  }

  function editStore(store: Store) {
    setActiveTab('stores');
    setStoreForm({
      id: store.id,
      name: store.name,
      category: store.category,
      amount: String(store.amount),
      visits: String(store.visits),
      favorite: store.favorite,
      mine: store.mine,
    });
  }

  function incrementVisit(storeId: number) {
    setStores(currentStores =>
      currentStores.map(store =>
        store.id === storeId
          ? {
              ...store,
              visits: store.visits + 1,
            }
          : store,
      ),
    );
  }

  function addQuickAmount(storeId: number, amount: number) {
    setStores(currentStores =>
      currentStores.map(store =>
        store.id === storeId
          ? {
              ...store,
              amount: store.amount + amount,
            }
          : store,
      ),
    );
  }

  function toggleStoreFlag(storeId: number, flag: 'favorite' | 'mine') {
    setStores(currentStores =>
      currentStores.map(store =>
        store.id === storeId
          ? {
              ...store,
              [flag]: !store[flag],
            }
          : store,
      ),
    );
  }

  function addGroceryItem() {
    const trimmedName = groceryForm.name.trim();

    if (!trimmedName) {
      return;
    }

    setGroceryItems(currentItems => [
      {
        id: Date.now(),
        name: trimmedName,
        estimatedCost: toNumber(groceryForm.estimatedCost),
        quantity: Math.max(1, Math.round(toNumber(groceryForm.quantity))),
        checked: false,
      },
      ...currentItems,
    ]);
    setGroceryForm({name: '', estimatedCost: '', quantity: '1'});
  }

  function toggleGroceryItem(itemId: number) {
    setGroceryItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              checked: !item.checked,
            }
          : item,
      ),
    );
  }

  function removeGroceryItem(itemId: number) {
    setGroceryItems(currentItems =>
      currentItems.filter(item => item.id !== itemId),
    );
  }

  return (
    <View style={[styles.app, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require('./assets/brand/budget-tracker-logo.png')}
            style={styles.brandLogo}
          />
          <View>
            <Text style={styles.eyebrow}>Budget tracker</Text>
            <Text style={styles.title}>Budget Tracker</Text>
          </View>
        </View>
        <View style={styles.modeSwitch}>
          <PillButton
            label="Bi-weekly"
            selected={budgetMode === 'biweekly'}
            onPress={() => setBudgetMode('biweekly')}
          />
          <PillButton
            label="Monthly"
            selected={budgetMode === 'monthly'}
            onPress={() => setBudgetMode('monthly')}
          />
        </View>
      </View>

      <View style={styles.tabBar}>
        <TabButton
          label="Stores"
          selected={activeTab === 'stores'}
          onPress={() => setActiveTab('stores')}
        />
        <TabButton
          label="Budget"
          selected={activeTab === 'budget'}
          onPress={() => setActiveTab('budget')}
        />
        <TabButton
          label="Grocery"
          selected={activeTab === 'grocery'}
          onPress={() => setActiveTab('grocery')}
        />
        <TabButton
          label="Reports"
          selected={activeTab === 'reports'}
          onPress={() => setActiveTab('reports')}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: 132 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        <OverviewCards totals={totals} budgetMode={budgetMode} />
        {storageError ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{storageError}</Text>
          </View>
        ) : null}

        {activeTab === 'stores' ? (
          <StoresTab
            storeForm={storeForm}
            setStoreForm={setStoreForm}
            sortedStores={sortedStores}
            saveStore={saveStore}
            resetStoreForm={resetStoreForm}
            editStore={editStore}
            incrementVisit={incrementVisit}
            addQuickAmount={addQuickAmount}
            toggleStoreFlag={toggleStoreFlag}
          />
        ) : null}

        {activeTab === 'budget' ? (
          <BudgetTab
            budgetMode={budgetMode}
            setBudgetMode={setBudgetMode}
            biweeklyBudget={biweeklyBudget}
            monthlyBudget={monthlyBudget}
            savingsGoal={savingsGoal}
            setBiweeklyBudget={setBiweeklyBudget}
            setMonthlyBudget={setMonthlyBudget}
            setSavingsGoal={setSavingsGoal}
            totals={totals}
          />
        ) : null}

        {activeTab === 'grocery' ? (
          <GroceryTab
            groceryForm={groceryForm}
            setGroceryForm={setGroceryForm}
            groceryItems={groceryItems}
            addGroceryItem={addGroceryItem}
            toggleGroceryItem={toggleGroceryItem}
            removeGroceryItem={removeGroceryItem}
            groceryPlanned={totals.groceryPlanned}
            groceryRemaining={totals.groceryRemaining}
          />
        ) : null}

        {activeTab === 'reports' ? (
          <ReportsTab
            totals={totals}
            categoryTotals={categoryTotals}
            stores={stores}
            biweeklyBudget={toNumber(biweeklyBudget)}
            monthlyBudget={toNumber(monthlyBudget)}
          />
        ) : null}
      </ScrollView>

      <BottomSummary totals={totals} budgetMode={budgetMode} />
    </View>
  );
}

function OverviewCards({
  totals,
  budgetMode,
}: {
  totals: Totals;
  budgetMode: BudgetMode;
}) {
  const percentSpent =
    totals.activeBudget > 0
      ? Math.min(100, Math.round((totals.spent / totals.activeBudget) * 100))
      : 0;
  const isOverBudget = totals.remaining < 0;

  return (
    <View style={styles.overviewGrid}>
      <View style={styles.primaryCard}>
        <Text style={styles.cardLabel}>Total spent</Text>
        <Text style={styles.totalText}>{toMoney(totals.spent)}</Text>
        <Text style={styles.cardNote}>
          {percentSpent}% of {budgetMode} budget used
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              isOverBudget ? styles.progressFillDanger : null,
              {
                width: `${percentSpent}%`,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.sideCard}>
        <Text style={styles.cardLabel}>Visits</Text>
        <Text style={styles.metricText}>{totals.visits}</Text>
        <Text style={styles.cardNote}>Across saved stores</Text>
      </View>
    </View>
  );
}

function StoresTab({
  storeForm,
  setStoreForm,
  sortedStores,
  saveStore,
  resetStoreForm,
  editStore,
  incrementVisit,
  addQuickAmount,
  toggleStoreFlag,
}: {
  storeForm: StoreForm;
  setStoreForm: React.Dispatch<React.SetStateAction<StoreForm>>;
  sortedStores: Store[];
  saveStore: () => void;
  resetStoreForm: () => void;
  editStore: (store: Store) => void;
  incrementVisit: (storeId: number) => void;
  addQuickAmount: (storeId: number, amount: number) => void;
  toggleStoreFlag: (storeId: number, flag: 'favorite' | 'mine') => void;
}) {
  return (
    <>
      <Section title={storeForm.id ? 'Edit store' : 'Add store'}>
        <TextInput
          style={styles.input}
          placeholder="Store name"
          placeholderTextColor="#7A817B"
          value={storeForm.name}
          onChangeText={name => setStoreForm(current => ({...current, name}))}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="Amount spent"
            placeholderTextColor="#7A817B"
            keyboardType="decimal-pad"
            value={storeForm.amount}
            onChangeText={amount =>
              setStoreForm(current => ({...current, amount}))
            }
          />
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Visits"
            placeholderTextColor="#7A817B"
            keyboardType="number-pad"
            value={storeForm.visits}
            onChangeText={visits =>
              setStoreForm(current => ({...current, visits}))
            }
          />
        </View>
        <View style={styles.choiceWrap}>
          {categories.map(category => (
            <PillButton
              key={category}
              label={category}
              selected={storeForm.category === category}
              onPress={() =>
                setStoreForm(current => ({...current, category}))
              }
            />
          ))}
        </View>
        <View style={styles.row}>
          <ToggleButton
            label={storeForm.favorite ? 'Starred' : 'Star store'}
            selected={storeForm.favorite}
            onPress={() =>
              setStoreForm(current => ({
                ...current,
                favorite: !current.favorite,
              }))
            }
          />
          <ToggleButton
            label={storeForm.mine ? 'My store' : 'Mark mine'}
            selected={storeForm.mine}
            onPress={() =>
              setStoreForm(current => ({...current, mine: !current.mine}))
            }
          />
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={saveStore}>
            <Text style={styles.primaryButtonText}>
              {storeForm.id ? 'Update store' : 'Add store'}
            </Text>
          </TouchableOpacity>
          {storeForm.id ? (
            <TouchableOpacity style={styles.ghostButton} onPress={resetStoreForm}>
              <Text style={styles.ghostButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Section>

      <Section title="Saved stores">
        {sortedStores.map(store => (
          <StoreCard
            key={store.id}
            store={store}
            onEdit={() => editStore(store)}
            onVisit={() => incrementVisit(store.id)}
            onQuickAdd={amount => addQuickAmount(store.id, amount)}
            onToggleFavorite={() => toggleStoreFlag(store.id, 'favorite')}
            onToggleMine={() => toggleStoreFlag(store.id, 'mine')}
          />
        ))}
      </Section>
    </>
  );
}

function BudgetTab({
  budgetMode,
  setBudgetMode,
  biweeklyBudget,
  monthlyBudget,
  savingsGoal,
  setBiweeklyBudget,
  setMonthlyBudget,
  setSavingsGoal,
  totals,
}: {
  budgetMode: BudgetMode;
  setBudgetMode: (mode: BudgetMode) => void;
  biweeklyBudget: string;
  monthlyBudget: string;
  savingsGoal: string;
  setBiweeklyBudget: (value: string) => void;
  setMonthlyBudget: (value: string) => void;
  setSavingsGoal: (value: string) => void;
  totals: Totals;
}) {
  return (
    <>
      <Section title="Budget setup">
        <View style={styles.choiceWrap}>
          <PillButton
            label="Bi-weekly budget"
            selected={budgetMode === 'biweekly'}
            onPress={() => setBudgetMode('biweekly')}
          />
          <PillButton
            label="Monthly budget"
            selected={budgetMode === 'monthly'}
            onPress={() => setBudgetMode('monthly')}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Bi-weekly budget"
          placeholderTextColor="#7A817B"
          keyboardType="decimal-pad"
          value={biweeklyBudget}
          onChangeText={setBiweeklyBudget}
        />
        <TextInput
          style={styles.input}
          placeholder="Monthly budget"
          placeholderTextColor="#7A817B"
          keyboardType="decimal-pad"
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
        />
        <TextInput
          style={styles.input}
          placeholder="Savings goal"
          placeholderTextColor="#7A817B"
          keyboardType="decimal-pad"
          value={savingsGoal}
          onChangeText={setSavingsGoal}
        />
      </Section>

      <Section title="Budget health">
        <InfoRow label="Active budget" value={toMoney(totals.activeBudget)} />
        <InfoRow label="Spent so far" value={toMoney(totals.spent)} />
        <InfoRow
          label="Remaining"
          value={toMoney(totals.remaining)}
          danger={totals.remaining < 0}
        />
        <InfoRow
          label="Remaining after grocery list"
          value={toMoney(totals.projectedRemaining)}
          danger={totals.projectedRemaining < 0}
        />
        <InfoRow
          label="Savings goal buffer"
          value={toMoney(totals.savingsReady)}
        />
      </Section>
    </>
  );
}

function GroceryTab({
  groceryForm,
  setGroceryForm,
  groceryItems,
  addGroceryItem,
  toggleGroceryItem,
  removeGroceryItem,
  groceryPlanned,
  groceryRemaining,
}: {
  groceryForm: {name: string; estimatedCost: string; quantity: string};
  setGroceryForm: React.Dispatch<
    React.SetStateAction<{name: string; estimatedCost: string; quantity: string}>
  >;
  groceryItems: GroceryItem[];
  addGroceryItem: () => void;
  toggleGroceryItem: (itemId: number) => void;
  removeGroceryItem: (itemId: number) => void;
  groceryPlanned: number;
  groceryRemaining: number;
}) {
  return (
    <>
      <Section title="Grocery list">
        <TextInput
          style={styles.input}
          placeholder="Item name"
          placeholderTextColor="#7A817B"
          value={groceryForm.name}
          onChangeText={name => setGroceryForm(current => ({...current, name}))}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="Estimated cost"
            placeholderTextColor="#7A817B"
            keyboardType="decimal-pad"
            value={groceryForm.estimatedCost}
            onChangeText={estimatedCost =>
              setGroceryForm(current => ({...current, estimatedCost}))
            }
          />
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Qty"
            placeholderTextColor="#7A817B"
            keyboardType="number-pad"
            value={groceryForm.quantity}
            onChangeText={quantity =>
              setGroceryForm(current => ({...current, quantity}))
            }
          />
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={addGroceryItem}>
          <Text style={styles.primaryButtonText}>Add grocery item</Text>
        </TouchableOpacity>
      </Section>

      <Section title="Shopping plan">
        <InfoRow label="Estimated list" value={toMoney(groceryPlanned)} />
        <InfoRow label="Not bought yet" value={toMoney(groceryRemaining)} />
        {groceryItems.map(item => (
          <View key={item.id} style={styles.groceryRow}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.checked ? styles.checkboxSelected : null,
              ]}
              onPress={() => toggleGroceryItem(item.id)}>
              <Text style={styles.checkboxText}>{item.checked ? 'x' : ''}</Text>
            </TouchableOpacity>
            <View style={styles.groceryCopy}>
              <Text
                style={[
                  styles.groceryName,
                  item.checked ? styles.completedText : null,
                ]}>
                {item.name}
              </Text>
              <Text style={styles.groceryMeta}>
                {item.quantity} x {toMoney(item.estimatedCost)}
              </Text>
            </View>
            <Text style={styles.groceryPrice}>
              {toMoney(item.quantity * item.estimatedCost)}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeGroceryItem(item.id)}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Section>
    </>
  );
}

function ReportsTab({
  totals,
  categoryTotals,
  stores,
  biweeklyBudget,
  monthlyBudget,
}: {
  totals: Totals;
  categoryTotals: {category: StoreCategory; amount: number; visits: number}[];
  stores: Store[];
  biweeklyBudget: number;
  monthlyBudget: number;
}) {
  const averageVisit =
    totals.visits > 0 ? totals.spent / totals.visits : totals.spent;
  const topStore = [...stores].sort((a, b) => b.amount - a.amount)[0];

  return (
    <>
      <Section title="Reports">
        <InfoRow label="Bi-weekly spent" value={toMoney(totals.spent)} />
        <InfoRow
          label="Bi-weekly remaining"
          value={toMoney(biweeklyBudget - totals.spent)}
          danger={biweeklyBudget - totals.spent < 0}
        />
        <InfoRow label="Monthly spent" value={toMoney(totals.spent)} />
        <InfoRow
          label="Monthly remaining"
          value={toMoney(monthlyBudget - totals.spent)}
          danger={monthlyBudget - totals.spent < 0}
        />
        <InfoRow label="Average per visit" value={toMoney(averageVisit)} />
        <InfoRow label="Most expensive store" value={topStore?.name ?? 'None'} />
      </Section>

      <Section title="Category breakdown">
        {categoryTotals.map(item => (
          <View key={item.category} style={styles.reportBarRow}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportLabel}>{item.category}</Text>
              <Text style={styles.reportValue}>
                {toMoney(item.amount)} / {item.visits} visits
              </Text>
            </View>
            <View style={styles.reportTrack}>
              <View
                style={[
                  styles.reportFill,
                  {
                    width: `${Math.min(
                      100,
                      totals.spent > 0
                        ? Math.round((item.amount / totals.spent) * 100)
                        : 0,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </Section>

      <Section title="Smart notes">
        <Text style={styles.noteText}>
          {totals.remaining < 0
            ? 'You are over the active budget. Pause non-essential trips or move money from a buffer.'
            : 'Your active budget still has room. Check the grocery projection before the next store run.'}
        </Text>
        <Text style={styles.noteText}>
          Starred stores are sorted first, then stores with the highest visit
          count, so your common stops stay easy to update.
        </Text>
      </Section>
    </>
  );
}

function StoreCard({
  store,
  onEdit,
  onVisit,
  onQuickAdd,
  onToggleFavorite,
  onToggleMine,
}: {
  store: Store;
  onEdit: () => void;
  onVisit: () => void;
  onQuickAdd: (amount: number) => void;
  onToggleFavorite: () => void;
  onToggleMine: () => void;
}) {
  return (
    <View style={styles.storeCard}>
      <View style={styles.storeTopRow}>
        <View style={styles.storeNameBlock}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeMeta}>
            {store.category} / {store.visits} visits
          </Text>
        </View>
        <Text style={styles.storeAmount}>{toMoney(store.amount)}</Text>
      </View>

      <View style={styles.tagRow}>
        {store.favorite ? <Text style={styles.tag}>Starred</Text> : null}
        {store.mine ? <Text style={styles.tag}>My store</Text> : null}
        <Text style={styles.tag}>
          Avg {toMoney(store.visits > 0 ? store.amount / store.visits : 0)}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <SmallButton label="Edit" onPress={onEdit} />
        <SmallButton label="+ Visit" onPress={onVisit} />
        <SmallButton label="+ $10" onPress={() => onQuickAdd(10)} />
        <SmallButton label="+ $25" onPress={() => onQuickAdd(25)} />
      </View>
      <View style={styles.cardActions}>
        <SmallButton
          label={store.favorite ? 'Unstar' : 'Star'}
          onPress={onToggleFavorite}
        />
        <SmallButton
          label={store.mine ? 'Unmark mine' : 'Mark mine'}
          onPress={onToggleMine}
        />
      </View>
    </View>
  );
}

function BottomSummary({
  totals,
  budgetMode,
}: {
  totals: Totals;
  budgetMode: BudgetMode;
}) {
  return (
    <View style={styles.bottomSummary}>
      <View>
        <Text style={styles.bottomLabel}>Spent</Text>
        <Text style={styles.bottomValue}>{toMoney(totals.spent)}</Text>
      </View>
      <View style={styles.bottomDivider} />
      <View>
        <Text style={styles.bottomLabel}>
          Remaining {budgetMode === 'biweekly' ? 'bi-weekly' : 'monthly'}
        </Text>
        <Text
          style={[
            styles.bottomValue,
            totals.remaining < 0 ? styles.dangerText : null,
          ]}>
          {toMoney(totals.remaining)}
        </Text>
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TabButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, selected ? styles.tabButtonSelected : null]}
      onPress={onPress}>
      <Text style={[styles.tabText, selected ? styles.tabTextSelected : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PillButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected ? styles.pillSelected : null]}
      onPress={onPress}>
      <Text style={[styles.pillText, selected ? styles.pillTextSelected : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ToggleButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggleButton, selected ? styles.toggleSelected : null]}
      onPress={onPress}>
      <Text
        style={[
          styles.toggleButtonText,
          selected ? styles.toggleTextSelected : null,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SmallButton({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.smallButton} onPress={onPress}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, danger ? styles.dangerText : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 12,
    backgroundColor: '#F4F1EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  eyebrow: {
    color: '#66746C',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17251E',
    fontSize: 30,
    fontWeight: '800',
  },
  modeSwitch: {
    alignItems: 'flex-end',
    gap: 8,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: '#F4F1EA',
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D1C8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEFCF6',
  },
  tabButtonSelected: {
    backgroundColor: '#1F4D40',
    borderColor: '#1F4D40',
  },
  tabText: {
    color: '#32433A',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 14,
    gap: 14,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryCard: {
    flex: 1.5,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FEFCF6',
    borderWidth: 1,
    borderColor: '#D9DED5',
  },
  sideCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#EAF2EF',
    borderWidth: 1,
    borderColor: '#C9DCD3',
  },
  cardLabel: {
    color: '#66746C',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  totalText: {
    color: '#17251E',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  metricText: {
    color: '#17251E',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  cardNote: {
    color: '#596960',
    fontSize: 13,
    marginTop: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DCE3DD',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#256F5C',
  },
  progressFillDanger: {
    backgroundColor: '#D14343',
  },
  warningBanner: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9B45D',
    backgroundColor: '#FFF4D8',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningText: {
    color: '#6A4A05',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#17251E',
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D1C8',
    backgroundColor: '#FEFCF6',
    paddingHorizontal: 14,
    color: '#17251E',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flexInput: {
    flex: 1,
  },
  smallInput: {
    width: 96,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D1C8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEFCF6',
  },
  pillSelected: {
    backgroundColor: '#DCEBE4',
    borderColor: '#91B3A5',
  },
  pillText: {
    color: '#36483E',
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: '#1F4D40',
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D1C8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEFCF6',
  },
  toggleSelected: {
    backgroundColor: '#F5DBA7',
    borderColor: '#D9B45D',
  },
  toggleButtonText: {
    color: '#38483F',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleTextSelected: {
    color: '#533A08',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1F4D40',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  ghostButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D1C8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#FEFCF6',
  },
  ghostButtonText: {
    color: '#1F4D40',
    fontSize: 15,
    fontWeight: '800',
  },
  storeCard: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#FEFCF6',
    borderWidth: 1,
    borderColor: '#D9DED5',
    gap: 10,
  },
  storeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  storeNameBlock: {
    flex: 1,
  },
  storeName: {
    color: '#17251E',
    fontSize: 17,
    fontWeight: '800',
  },
  storeMeta: {
    color: '#66746C',
    fontSize: 13,
    marginTop: 3,
  },
  storeAmount: {
    color: '#17251E',
    fontSize: 17,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#EEF0EA',
    color: '#4C5C53',
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallButton: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D1C8',
    backgroundColor: '#F7F8F2',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  smallButtonText: {
    color: '#2F493D',
    fontSize: 13,
    fontWeight: '800',
  },
  infoRow: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#FEFCF6',
    borderWidth: 1,
    borderColor: '#D9DED5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
  },
  infoLabel: {
    flex: 1,
    color: '#52645A',
    fontSize: 14,
    fontWeight: '700',
  },
  infoValue: {
    color: '#17251E',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  dangerText: {
    color: '#C93838',
  },
  groceryRow: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: '#FEFCF6',
    borderWidth: 1,
    borderColor: '#D9DED5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#91B3A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1F4D40',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  groceryCopy: {
    flex: 1,
  },
  groceryName: {
    color: '#17251E',
    fontSize: 15,
    fontWeight: '800',
  },
  completedText: {
    color: '#8B928B',
    textDecorationLine: 'line-through',
  },
  groceryMeta: {
    color: '#66746C',
    fontSize: 12,
    marginTop: 2,
  },
  groceryPrice: {
    color: '#17251E',
    fontSize: 14,
    fontWeight: '800',
  },
  removeButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#A23838',
    fontSize: 12,
    fontWeight: '800',
  },
  reportBarRow: {
    gap: 7,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  reportLabel: {
    color: '#17251E',
    fontSize: 14,
    fontWeight: '800',
  },
  reportValue: {
    color: '#66746C',
    fontSize: 13,
    fontWeight: '700',
  },
  reportTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#DCE3DD',
    overflow: 'hidden',
  },
  reportFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#477E70',
  },
  noteText: {
    color: '#3F4E45',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEFCF6',
    borderWidth: 1,
    borderColor: '#D9DED5',
  },
  bottomSummary: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: '#17251E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  bottomLabel: {
    color: '#AEC4BA',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bottomValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  bottomDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#3E5D51',
  },
});

export default App;
