<template>
  <div class="groups">
    <div class="page-header">
      <h2>🎯 Groups</h2>
      <p>Create and manage your fund groups</p>
    </div>

    <div class="create-group-card">
      <h3>✨ Create a New Group</h3>
      <Form @submit="createGroup" v-slot="{ errors }">
        <div class="form-group">
          <Field name="groupName" v-slot="{ field }">
            <input 
              v-bind="field" 
              placeholder="Enter group name (e.g., Quỹ du lịch)" 
              class="input-field"
              :class="{ 'input-error': errors.groupName }"
            >
          </Field>
          <span v-if="errors.groupName" class="error">{{ errors.groupName }}</span>
        </div>
        <button type="submit" class="btn btn-create">
          <span class="btn-icon">+</span>
          Create Group
        </button>
      </Form>
    </div>

    <div class="groups-section">
      <h3>👥 Your Groups</h3>
      <div v-if="groups.length" class="groups-grid">
        <div v-for="group in groups" :key="group.id" class="group-card">
          <div class="group-card-header">
            <div class="group-icon">💰</div>
            <div class="group-info">
              <h4>{{ group.name }}</h4>
              <p class="group-owner">{{ group.ownerId === currentUserId ? 'Owner' : 'Member' }}</p>
            </div>
          </div>
          <div class="group-card-actions">
            <router-link 
              :to="{ path: `/group/${group.id}`, query: { name: group.name } }" 
              class="btn btn-view"
            >
              View Transactions →
            </router-link>
            <button 
              v-if="group.ownerId === currentUserId"
              @click="inviteMember(group.id)" 
              class="btn btn-add-member"
            >
              + Invite Member
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <p>You haven't created or joined any groups yet.</p>
        <p class="empty-hint">Create your first group above!</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGroupStore } from '../store'
import { Form, Field } from 'vee-validate'
import * as yup from 'yup'
import { auth } from '../firebase/config'

export default {
  name: 'Groups',
  components: {
    Form,
    Field,
  },
  setup() {
    const groupStore = useGroupStore()
    const { groups } = storeToRefs(groupStore)
    const currentUserId = computed(() => auth.currentUser?.uid)

    const schema = yup.object({
      groupName: yup.string().required('Group name is required').min(3, 'Group name must be at least 3 characters'),
    })

    const createGroup = async (values) => {
      try {
        const newGroup = {
          name: values.groupName
        }
        await groupStore.createGroup(newGroup, auth.currentUser.uid)
        values.groupName = '' // Clear input
      } catch (error) {
        console.error('Failed to create group:', error)
        alert('Failed to create group: ' + error.message)
      }
    }

    const inviteMember = async (groupId) => {
      const email = prompt('Enter the email of the user you want to invite:')
      if (email) {
        // TODO: Implement user lookup by email and add to group
        alert('Feature coming soon! For now, share the group ID: ' + groupId)
      }
    }

    onMounted(async () => {
      if (auth.currentUser) {
        await groupStore.loadGroups(auth.currentUser.uid)
      }
    })

    return {
      groups,
      createGroup,
      inviteMember,
      schema,
      currentUserId,
    }
  }
}
</script>

<style scoped>
.groups {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h2 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

/* Create Group Card */
.create-group-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 3rem;
}

.create-group-card h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.input-field {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
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
}

.btn-create {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 100%;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.btn-icon {
  font-size: 1.5rem;
  font-weight: 700;
}

/* Groups Section */
.groups-section {
  margin-top: 3rem;
}

.groups-section h3 {
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Group Card */
.group-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.group-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.group-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.group-info h4 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.group-owner {
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
}

.group-card-actions {
  display: flex;
  gap: 0.75rem;
  flex-direction: column;
}

.btn-view {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  text-align: center;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.btn-view:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
}

.btn-add-member {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-add-member:hover {
  background: #667eea;
  color: white;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.empty-hint {
  color: #999;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header h2 {
    font-size: 2rem;
  }
}
</style>