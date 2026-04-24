<template>
  <div class="notifications-container">
    <button @click="toggleNotifications" class="notifications-btn" :class="{ 'has-notifications': unreadCount > 0 }">
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </button>

    <div v-if="showNotifications" class="notifications-panel">
      <div class="notifications-header">
        <h3>🔔 Notifications</h3>
        <button @click="closeNotifications" class="btn-close">✕</button>
      </div>
      
      <div class="notifications-body">
        <div v-if="invitations.length" class="notifications-list">
          <div v-for="invitation in invitations" :key="invitation.id" class="notification-item">
            <div class="notification-icon">📨</div>
            <div class="notification-content">
              <p class="notification-title">Group Invitation</p>
              <p class="notification-message">
                <strong>{{ invitation.inviterEmail }}</strong> invited you to join 
                <strong>{{ invitation.groupName }}</strong>
              </p>
              <p class="notification-time">{{ formatDate(invitation.createdAt) }}</p>
            </div>
            <div class="notification-actions">
              <button 
                @click="acceptInvitation(invitation)" 
                class="btn btn-accept"
                :disabled="processingInvitation === invitation.id"
              >
                ✓ Accept
              </button>
              <button 
                @click="rejectInvitation(invitation.id)" 
                class="btn btn-reject"
                :disabled="processingInvitation === invitation.id"
              >
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-notifications">
          <div class="empty-icon">📭</div>
          <p>No new notifications</p>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div v-if="showNotifications" class="notifications-overlay" @click="closeNotifications"></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { auth } from '../firebase/config'
import { useInvitationStore } from '../store'

export default {
  name: 'Notifications',
  setup() {
    const invitationStore = useInvitationStore()
    const showNotifications = ref(false)
    const processingInvitation = ref(null)
    let unsubscribe = null

    const invitations = computed(() => invitationStore.invitations)
    const unreadCount = computed(() => invitations.value.filter(inv => inv.status === 'pending').length)

    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
    }

    const closeNotifications = () => {
      showNotifications.value = false
    }

    const acceptInvitation = async (invitation) => {
      try {
        processingInvitation.value = invitation.id
        await invitationStore.acceptInvitation(invitation.id, invitation.groupId)
        alert(`✅ You have joined ${invitation.groupName}!`)
      } catch (error) {
        console.error('Failed to accept invitation:', error)
        alert('Failed to accept invitation: ' + error.message)
      } finally {
        processingInvitation.value = null
      }
    }

    const rejectInvitation = async (invitationId) => {
      try {
        processingInvitation.value = invitationId
        await invitationStore.rejectInvitation(invitationId)
      } catch (error) {
        console.error('Failed to reject invitation:', error)
        alert('Failed to reject invitation: ' + error.message)
      } finally {
        processingInvitation.value = null
      }
    }

    const formatDate = (date) => {
      if (!date) return ''
      const d = date.toDate ? date.toDate() : new Date(date)
      const now = new Date()
      const diff = now - d
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Just now'
      if (minutes < 60) return `${minutes}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
      return d.toLocaleDateString('vi-VN')
    }

    onMounted(async () => {
      if (auth.currentUser) {
        // Load invitations và subscribe to real-time updates
        unsubscribe = await invitationStore.loadInvitations(auth.currentUser.uid)
      }
    })

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })

    return {
      showNotifications,
      invitations,
      unreadCount,
      processingInvitation,
      toggleNotifications,
      closeNotifications,
      acceptInvitation,
      rejectInvitation,
      formatDate,
    }
  }
}
</script>

<style scoped>
.notifications-container {
  position: relative;
}

.notifications-btn {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.notifications-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.notifications-btn.has-notifications {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 4px 25px rgba(239, 68, 68, 0.5);
  }
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid white;
}

.notifications-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.notifications-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 420px;
  max-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 999;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.notifications-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.notifications-body {
  overflow-y: auto;
  max-height: 500px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s ease;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.notification-message {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.notification-time {
  margin: 0;
  color: #999;
  font-size: 0.8rem;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-accept {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-accept:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-reject {
  background: #f3f4f6;
  color: #666;
}

.btn-reject:hover:not(:disabled) {
  background: #e5e7eb;
  color: #333;
}

.empty-notifications {
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-notifications p {
  margin: 0;
  color: #999;
}

@media (max-width: 768px) {
  .notifications-panel {
    right: 10px;
    left: 10px;
    width: auto;
    top: 70px;
  }
}
</style>
