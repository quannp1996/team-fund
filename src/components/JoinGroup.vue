<template>
  <div class="join-group">
    <div class="join-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner">⏳</div>
        <h2>Loading...</h2>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h2>{{ error }}</h2>
        <button @click="$router.push('/')" class="btn btn-primary">
          Go to Groups
        </button>
      </div>

      <div v-else-if="!user" class="login-required">
        <div class="icon">🔐</div>
        <h2>Login Required</h2>
        <p>Please sign in to join this group</p>
        <button @click="$router.push('/')" class="btn btn-primary">
          Sign In
        </button>
      </div>

      <div v-else-if="alreadyMember" class="success-state">
        <div class="success-icon">✅</div>
        <h2>You're already a member!</h2>
        <p>Group: {{ groupName }}</p>
        <button @click="$router.push(`/group/${groupId}`)" class="btn btn-primary">
          View Group
        </button>
      </div>

      <div v-else class="join-prompt">
        <div class="icon">👥</div>
        <h2>Join Group</h2>
        <div class="group-info">
          <p class="group-name">{{ groupName }}</p>
          <p class="group-meta">You've been invited to join this group</p>
        </div>
        <button @click="joinGroup" class="btn btn-primary" :disabled="joining">
          {{ joining ? 'Joining...' : 'Join Group' }}
        </button>
        <button @click="$router.push('/')" class="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupStore } from '../store'
import { auth } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default {
  name: 'JoinGroup',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const groupStore = useGroupStore()
    
    const groupId = computed(() => route.params.id)
    const user = computed(() => auth.currentUser)
    
    const loading = ref(true)
    const joining = ref(false)
    const error = ref(null)
    const groupName = ref('')
    const alreadyMember = ref(false)

    const loadGroupInfo = async () => {
      try {
        loading.value = true
        error.value = null

        // Load group info
        const groupDoc = await getDoc(doc(db, 'groups', groupId.value))
        
        if (!groupDoc.exists()) {
          error.value = 'Group not found'
          return
        }

        groupName.value = groupDoc.data().name

        // Check if already member
        if (user.value) {
          const memberDoc = await getDoc(
            doc(db, 'groups', groupId.value, 'members', user.value.uid)
          )
          alreadyMember.value = memberDoc.exists()
        }
      } catch (err) {
        console.error('Error loading group:', err)
        error.value = 'Failed to load group information'
      } finally {
        loading.value = false
      }
    }

    const joinGroup = async () => {
      try {
        joining.value = true
        await groupStore.addMember(
          groupId.value, 
          user.value.uid, 
          'member',
          user.value.email
        )
        
        // Redirect to group page
        router.push(`/group/${groupId.value}?name=${groupName.value}`)
      } catch (err) {
        console.error('Error joining group:', err)
        alert('Failed to join group: ' + err.message)
      } finally {
        joining.value = false
      }
    }

    onMounted(() => {
      loadGroupInfo()
    })

    return {
      user,
      loading,
      joining,
      error,
      groupId,
      groupName,
      alreadyMember,
      joinGroup,
    }
  }
}
</script>

<style scoped>
.join-group {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.join-container {
  background: white;
  padding: 3rem 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 450px;
  width: 100%;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon,
.success-icon,
.error-icon,
.spinner {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h2 {
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 700;
}

p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.group-info {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  margin: 1.5rem 0;
}

.group-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.group-meta {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}

.btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  margin-top: 0.75rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #757575;
  border: 2px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #d0d0d0;
}

.success-icon {
  color: #10b981;
}

.error-icon {
  color: #ef4444;
}

@media (max-width: 768px) {
  .join-container {
    padding: 2rem 1.5rem;
  }
}
</style>
