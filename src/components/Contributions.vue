<template>
  <div class="contributions">
    <div class="page-header">
      <button @click="$router.back()" class="btn-back">← Back</button>
      <h2>💰 {{ teamName }}</h2>
      <p>Monthly Contributions</p>
    </div>

    <div v-if="team">
      <!-- Set Amount Card -->
      <div class="card amount-card">
        <h3>💵 Set Monthly Contribution</h3>
        <Form @submit="setContributionAmount" v-slot="{ errors }">
          <div class="form-group">
            <Field name="amount" v-slot="{ field }">
              <div class="input-wrapper">
                <span class="currency">$</span>
                <input 
                  v-bind="field" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00"
                  class="input-field"
                  :class="{ 'input-error': errors.amount }"
                >
              </div>
            </Field>
            <span v-if="errors.amount" class="error">{{ errors.amount }}</span>
          </div>
          <button type="submit" class="btn btn-primary">
            Set Amount for All Members
          </button>
        </Form>
      </div>

      <!-- Your Status Card -->
      <div class="card status-card">
        <h3>📊 Your Status</h3>
        <div v-if="userContribution" class="status-content">
          <div class="status-info">
            <div class="info-item">
              <span class="label">Amount</span>
              <span class="value">${{ userContribution.amount }}</span>
            </div>
            <div class="info-item">
              <span class="label">Status</span>
              <span :class="['status-badge', userContribution.paid ? 'paid' : 'unpaid']">
                {{ userContribution.paid ? '✓ Paid' : '⏳ Unpaid' }}
              </span>
            </div>
          </div>
          <button 
            v-if="!userContribution.paid" 
            @click="markAsPaid"
            class="btn btn-pay"
          >
            ✓ Mark as Paid
          </button>
        </div>
        <div v-else class="empty-status">
          <p>No contribution set for this month.</p>
        </div>
      </div>

      <!-- Team Contributions Card -->
      <div class="card team-card">
        <h3>👥 Team Contributions</h3>
        <div v-if="teamContributions.length" class="contributions-list">
          <div 
            v-for="contribution in teamContributions" 
            :key="contribution.userId"
            class="contribution-item"
            :class="{ 'paid': contribution.paid }"
          >
            <div class="member-info">
              <div class="avatar">{{ contribution.userName?.charAt(0) || '?' }}</div>
              <div class="member-details">
                <span class="member-name">{{ contribution.userName || 'Unknown' }}</span>
                <span class="member-amount">${{ contribution.amount }}</span>
              </div>
            </div>
            <div class="member-actions">
              <span :class="['status-badge', contribution.paid ? 'paid' : 'unpaid']">
                {{ contribution.paid ? '✓ Paid' : '⏳ Unpaid' }}
              </span>
              <button 
                v-if="!contribution.paid" 
                @click="markMemberAsPaid(contribution.userId)"
                class="btn btn-mark"
              >
                Mark Paid
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-list">
          <p>No contributions yet.</p>
        </div>
      </div>
    </div>
    <div v-else class="error-state">
      <p>❌ Team not found.</p>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTeamStore, useContributionStore } from '../store'
import { Form, Field } from 'vee-validate'
import * as yup from 'yup'
import { auth } from '../firebase/config'

export default {
  name: 'Contributions',
  components: {
    Form,
    Field,
  },
  setup() {
    const route = useRoute()
    const teamStore = useTeamStore()
    const contributionStore = useContributionStore()
    const { teams } = storeToRefs(teamStore)
    const { contributions } = storeToRefs(contributionStore)

    const teamId = computed(() => route.params.id)
    const teamName = computed(() => route.query.name)
    const team = computed(() => teams.value.find(t => t.id.toString() === teamId.value))

    const schema = yup.object({
      amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
    })

    const teamContributions = computed(() => contributionStore.getTeamContributions(teamId.value))
    const userContribution = computed(() => teamContributions.value.find(c => c.userId === auth.currentUser.uid))

    const setContributionAmount = async (values) => {
      try {
        await Promise.all(team.value.members.map(userId => 
          contributionStore.setContribution(teamId.value, userId, values.amount, false)
        ))
        await contributionStore.loadContributions(teamId.value)
      } catch (error) {
        console.error('Failed to set contribution amount:', error)
      }
    }

    const markAsPaid = async () => {
      try {
        await contributionStore.setContribution(teamId.value, auth.currentUser.uid, userContribution.value.amount, true)
        await contributionStore.loadContributions(teamId.value)
      } catch (error) {
        console.error('Failed to mark contribution as paid:', error)
      }
    }

    const markMemberAsPaid = async (userId) => {
      try {
        const contribution = teamContributions.value.find(c => c.userId === userId)
        if (contribution) {
          await contributionStore.setContribution(teamId.value, userId, contribution.amount, true)
          await contributionStore.loadContributions(teamId.value)
        }
      } catch (error) {
        console.error('Failed to mark member contribution as paid:', error)
      }
    }

    onMounted(async () => {
      if (auth.currentUser) {
        await contributionStore.loadContributions(teamId.value)
      }
    })

    return {
      team,
      teamName,
      teamContributions,
      userContribution,
      setContributionAmount,
      markAsPaid,
      markMemberAsPaid,
      schema,
    }
  }
}
</script>

<style scoped>
.contributions {
  max-width: 800px;
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

/* Cards */
.card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.card h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

/* Amount Card */
.amount-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.amount-card h3 {
  color: white;
}

.form-group {
  margin-bottom: 1rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency {
  position: absolute;
  left: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.input-field {
  width: 100%;
  padding: 1rem 1rem 1rem 2.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: white;
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
  color: #fee;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: block;
}

/* Buttons */
.btn {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-primary {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.btn-pay {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  width: 100%;
  margin-top: 1rem;
}

.btn-pay:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.btn-mark {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background: #10b981;
  color: white;
  width: auto;
}

.btn-mark:hover {
  background: #059669;
}

/* Status Card */
.status-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  color: #999;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-block;
}

.status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.empty-status {
  text-align: center;
  padding: 2rem;
  color: #999;
}

/* Team Contributions */
.contributions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contribution-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.contribution-item:hover {
  background: #fff;
  border-color: #667eea;
  transform: translateX(4px);
}

.contribution-item.paid {
  background: #f0fdf4;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.member-amount {
  color: #667eea;
  font-weight: 700;
  font-size: 1.1rem;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.empty-list {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.error-state p {
  font-size: 1.25rem;
  color: #ef4444;
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
  
  .status-info {
    grid-template-columns: 1fr;
  }
  
  .contribution-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .member-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>