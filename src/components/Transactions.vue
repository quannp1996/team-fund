<template>
  <div class="transactions">
    <div class="page-header">
      <button @click="$router.back()" class="btn-back">← Back</button>
      <h2>💰 {{ groupName }}</h2>
      <p>Income & Expense Management</p>
    </div>

    <!-- Summary Card -->
    <div class="summary-grid">
      <div class="summary-card income-card">
        <div class="summary-icon">📈</div>
        <div class="summary-content">
          <span class="summary-label">Total Income</span>
          <span class="summary-value">{{ formatCurrency(totalIncome) }}</span>
        </div>
      </div>
      <div class="summary-card expense-card">
        <div class="summary-icon">📉</div>
        <div class="summary-content">
          <span class="summary-label">Total Expense</span>
          <span class="summary-value">{{ formatCurrency(totalExpense) }}</span>
        </div>
      </div>
      <div class="summary-card balance-card">
        <div class="summary-icon">💎</div>
        <div class="summary-content">
          <span class="summary-label">Balance</span>
          <span class="summary-value" :class="{ 'negative': balance < 0 }">
            {{ formatCurrency(balance) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Add Transaction Forms -->
    <div class="forms-grid">
      <!-- Add Income -->
      <div class="card income-form-card">
        <h3>💵 Add Income</h3>
        <Form @submit="addIncome" v-slot="{ errors }">
          <div class="form-group">
            <label>Month</label>
            <Field name="month" v-slot="{ field }">
              <input 
                v-bind="field" 
                type="month"
                class="input-field"
                :class="{ 'input-error': errors.month }"
              >
            </Field>
            <span v-if="errors.month" class="error">{{ errors.month }}</span>
          </div>
          
          <div class="form-group">
            <label>Member</label>
            <Field name="userId" v-slot="{ field }">
              <select 
                v-bind="field"
                class="input-field"
                :class="{ 'input-error': errors.userId }"
              >
                <option value="">Select member</option>
                <option v-for="member in members" :key="member.userId" :value="member.userId">
                  {{ member.userId === currentUserId ? 'You' : member.userId }}
                </option>
              </select>
            </Field>
            <span v-if="errors.userId" class="error">{{ errors.userId }}</span>
          </div>

          <div class="form-group">
            <label>Amount (VND)</label>
            <Field name="amount" v-slot="{ field }">
              <input 
                v-bind="field" 
                type="number"
                min="0"
                step="1000"
                placeholder="500000"
                class="input-field"
                :class="{ 'input-error': errors.amount }"
              >
            </Field>
            <span v-if="errors.amount" class="error">{{ errors.amount }}</span>
          </div>

          <div class="form-group">
            <label>Title</label>
            <Field name="title" v-slot="{ field }">
              <input 
                v-bind="field" 
                type="text"
                placeholder="Đóng quỹ tháng 4"
                class="input-field"
                :class="{ 'input-error': errors.title }"
              >
            </Field>
            <span v-if="errors.title" class="error">{{ errors.title }}</span>
          </div>

          <button type="submit" class="btn btn-income">
            + Add Income
          </button>
        </Form>
      </div>

      <!-- Add Expense -->
      <div class="card expense-form-card">
        <h3>💸 Add Expense</h3>
        <Form @submit="addExpense" v-slot="{ errors: expenseErrors }">
          <div class="form-group">
            <label>Amount (VND)</label>
            <Field name="expenseAmount" v-slot="{ field }">
              <input 
                v-bind="field" 
                type="number"
                min="0"
                step="1000"
                placeholder="200000"
                class="input-field"
                :class="{ 'input-error': expenseErrors.expenseAmount }"
              >
            </Field>
            <span v-if="expenseErrors.expenseAmount" class="error">{{ expenseErrors.expenseAmount }}</span>
          </div>

          <div class="form-group">
            <label>Title</label>
            <Field name="expenseTitle" v-slot="{ field }">
              <input 
                v-bind="field" 
                type="text"
                placeholder="Mua đồ ăn"
                class="input-field"
                :class="{ 'input-error': expenseErrors.expenseTitle }"
              >
            </Field>
            <span v-if="expenseErrors.expenseTitle" class="error">{{ expenseErrors.expenseTitle }}</span>
          </div>

          <button type="submit" class="btn btn-expense">
            - Add Expense
          </button>
        </Form>
      </div>
    </div>

    <!-- Transactions List -->
    <div class="card transactions-card">
      <div class="transactions-header">
        <h3>📋 Transaction History</h3>
        <select v-model="selectedMonth" class="month-filter">
          <option value="">All months</option>
          <option v-for="month in availableMonths" :key="month" :value="month">
            {{ formatMonth(month) }}
          </option>
        </select>
      </div>

      <div v-if="filteredTransactions.length" class="transactions-list">
        <div 
          v-for="transaction in filteredTransactions" 
          :key="transaction.id"
          :class="['transaction-item', transaction.type]"
        >
          <div class="transaction-icon">
            {{ transaction.type === 'income' ? '💵' : '💸' }}
          </div>
          <div class="transaction-info">
            <h4>{{ transaction.title }}</h4>
            <p class="transaction-meta">
              <span v-if="transaction.month">{{ formatMonth(transaction.month) }}</span>
              <span>{{ formatDate(transaction.createdAt) }}</span>
            </p>
          </div>
          <div class="transaction-amount">
            <span :class="['amount', transaction.type]">
              {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(Math.abs(transaction.amount)) }}
            </span>
            <button @click="deleteTransaction(transaction.id)" class="btn-delete">🗑️</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-transactions">
        <p>No transactions yet</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGroupStore, useTransactionStore } from '../store'
import { Form, Field } from 'vee-validate'
import * as yup from 'yup'
import { auth } from '../firebase/config'

export default {
  name: 'Transactions',
  components: {
    Form,
    Field,
  },
  setup() {
    const route = useRoute()
    const groupStore = useGroupStore()
    const transactionStore = useTransactionStore()
    const { transactions } = storeToRefs(transactionStore)
    
    const groupId = computed(() => route.params.id)
    const groupName = computed(() => route.query.name)
    const currentUserId = computed(() => auth.currentUser?.uid)
    const members = ref([])
    const selectedMonth = ref('')

    // Get current month as default
    const getCurrentMonth = () => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    const incomeSchema = yup.object({
      month: yup.string().required('Month is required'),
      userId: yup.string().required('Please select a member'),
      amount: yup.number().required('Amount is required').min(1000, 'Minimum 1,000 VND'),
      title: yup.string().required('Title is required'),
    })

    const expenseSchema = yup.object({
      expenseAmount: yup.number().required('Amount is required').min(1000, 'Minimum 1,000 VND'),
      expenseTitle: yup.string().required('Title is required'),
    })

    const addIncome = async (values) => {
      try {
        await transactionStore.addIncome(
          groupId.value,
          values.userId,
          currentUserId.value,
          values.amount,
          values.month,
          values.title
        )
        await transactionStore.loadTransactions(groupId.value)
        // Reset form
        values.month = getCurrentMonth()
        values.userId = ''
        values.amount = ''
        values.title = ''
      } catch (error) {
        console.error('Failed to add income:', error)
        alert('Failed to add income: ' + error.message)
      }
    }

    const addExpense = async (values) => {
      try {
        await transactionStore.addExpense(
          groupId.value,
          currentUserId.value,
          values.expenseAmount,
          values.expenseTitle
        )
        await transactionStore.loadTransactions(groupId.value)
        // Reset form
        values.expenseAmount = ''
        values.expenseTitle = ''
      } catch (error) {
        console.error('Failed to add expense:', error)
        alert('Failed to add expense: ' + error.message)
      }
    }

    const deleteTransaction = async (transactionId) => {
      if (confirm('Are you sure you want to delete this transaction?')) {
        try {
          await transactionStore.deleteTransaction(groupId.value, transactionId)
        } catch (error) {
          alert('Failed to delete transaction: ' + error.message)
        }
      }
    }

    const totalIncome = computed(() => transactionStore.getTotalIncome(selectedMonth.value))
    const totalExpense = computed(() => transactionStore.getTotalExpense)
    const balance = computed(() => transactionStore.getBalance)

    const availableMonths = computed(() => {
      const months = [...new Set(
        transactions.value
          .filter(t => t.month)
          .map(t => t.month)
      )]
      return months.sort().reverse()
    })

    const filteredTransactions = computed(() => {
      if (!selectedMonth.value) return transactions.value
      return transactions.value.filter(t => t.month === selectedMonth.value || t.type === 'expense')
    })

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount)
    }

    const formatMonth = (monthStr) => {
      if (!monthStr) return ''
      const [year, month] = monthStr.split('-')
      return `${month}/${year}`
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('vi-VN')
    }

    onMounted(async () => {
      if (auth.currentUser && groupId.value) {
        await transactionStore.loadTransactions(groupId.value)
        members.value = await groupStore.loadGroupMembers(groupId.value)
      }
    })

    return {
      groupName,
      currentUserId,
      members,
      selectedMonth,
      transactions,
      filteredTransactions,
      totalIncome,
      totalExpense,
      balance,
      availableMonths,
      addIncome,
      addExpense,
      deleteTransaction,
      formatCurrency,
      formatMonth,
      formatDate,
      incomeSchema,
      expenseSchema,
    }
  }
}
</script>

<style scoped>
.transactions {
  max-width: 1000px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
}

.btn-back {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #667eea;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.page-header h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  font-size: 2.5rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.875rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.summary-value.negative {
  color: #ef4444;
}

.income-card {
  border-left: 4px solid #10b981;
}

.expense-card {
  border-left: 4px solid #ef4444;
}

.balance-card {
  border-left: 4px solid #667eea;
}

/* Forms Grid */
.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card h3 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-field.input-error {
  border-color: #ef4444;
}

.error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.btn {
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  color: white;
  margin-top: 0.5rem;
}

.btn-income {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.btn-income:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.btn-expense {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.btn-expense:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

/* Transactions List */
.transactions-card {
  padding: 2rem;
}

.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.month-filter {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.transaction-item:hover {
  background: #fff;
  transform: translateX(4px);
}

.transaction-item.income {
  border-left-color: #10b981;
}

.transaction-item.expense {
  border-left-color: #ef4444;
}

.transaction-icon {
  font-size: 2rem;
}

.transaction-info {
  flex: 1;
}

.transaction-info h4 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.transaction-meta {
  font-size: 0.875rem;
  color: #999;
  display: flex;
  gap: 1rem;
}

.transaction-amount {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.amount {
  font-size: 1.25rem;
  font-weight: 700;
}

.amount.income {
  color: #10b981;
}

.amount.expense {
  color: #ef4444;
}

.btn-delete {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  opacity: 1;
  transform: scale(1.2);
}

.empty-transactions {
  text-align: center;
  padding: 3rem;
  color: #999;
}

/* Responsive */
@media (max-width: 768px) {
  .btn-back {
    position: static;
    transform: none;
    margin-bottom: 1rem;
  }
  
  .page-header {
    text-align: left;
  }
  
  .summary-grid,
  .forms-grid {
    grid-template-columns: 1fr;
  }
  
  .transactions-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .transaction-item {
    flex-wrap: wrap;
  }
}
</style>
