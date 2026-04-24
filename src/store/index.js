import { defineStore } from 'pinia'
import { db } from '../firebase/config'
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  doc,
  setDoc,
  orderBy,
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore'
import { auth } from '../firebase/config'

// Group Store
export const useGroupStore = defineStore('group', {
  state: () => ({
    groups: [],
    selectedGroup: null,
    groupMembers: [],
  }),
  actions: {
    async createGroup(groupData, userId) {
      try {
        // Tạo group
        const groupRef = await addDoc(collection(db, 'groups'), {
          name: groupData.name,
          ownerId: userId,
          createdAt: serverTimestamp()
        })
        
        // Thêm owner vào members với email
        await setDoc(doc(db, 'groups', groupRef.id, 'members', userId), {
          role: 'owner',
          email: auth.currentUser?.email || '',
          joinedAt: serverTimestamp()
        })
        
        const newGroup = {
          id: groupRef.id,
          ...groupData,
          ownerId: userId,
          createdAt: new Date()
        }
        this.groups.push(newGroup)
        return groupRef.id
      } catch (error) {
        console.error('Error creating group:', error)
        throw error
      }
    },
    
    async loadGroups(userId) {
      try {
        console.log('Loading groups for user:', userId)
        this.groups = []
        
        // Load groups mà user là owner
        const ownerQuery = query(
          collection(db, 'groups'),
          where('ownerId', '==', userId)
        )
        
        const ownerSnapshot = await getDocs(ownerQuery)
        console.log('Found owned groups:', ownerSnapshot.size)
        
        const groupIds = new Set()
        
        for (const groupDoc of ownerSnapshot.docs) {
          groupIds.add(groupDoc.id)
          this.groups.push({
            id: groupDoc.id,
            ...groupDoc.data()
          })
        }
        
        // Load groups mà user là member (không phải owner)
        // Query tất cả groups và check members subcollection
        const allGroupsSnapshot = await getDocs(collection(db, 'groups'))
        
        for (const groupDoc of allGroupsSnapshot.docs) {
          // Skip nếu đã load group này rồi (user là owner)
          if (groupIds.has(groupDoc.id)) continue
          
          // Check xem user có phải member không
          const memberDoc = await getDoc(doc(db, 'groups', groupDoc.id, 'members', userId))
          if (memberDoc.exists()) {
            this.groups.push({
              id: groupDoc.id,
              ...groupDoc.data()
            })
          }
        }
        
        console.log('Total loaded groups:', this.groups.length)
      } catch (error) {
        console.error('Error loading groups:', error)
        console.error('Error details:', error.code, error.message)
      }
    },
    
    async loadGroupMembers(groupId) {
      try {
        const membersSnapshot = await getDocs(
          collection(db, 'groups', groupId, 'members')
        )
        this.groupMembers = membersSnapshot.docs.map(doc => ({
          userId: doc.id,
          ...doc.data()
        }))
        return this.groupMembers
      } catch (error) {
        console.error('Error loading members:', error)
        return []
      }
    },

    async getGroupById(groupId) {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId))
        if (groupDoc.exists()) {
          return {
            id: groupDoc.id,
            ...groupDoc.data()
          }
        }
        return null
      } catch (error) {
        console.error('Error getting group:', error)
        return null
      }
    },
    
    async addMember(groupId, userId, role = 'member', email = '') {
      try {
        await setDoc(doc(db, 'groups', groupId, 'members', userId), {
          role: role,
          email: email,
          joinedAt: serverTimestamp()
        })
      } catch (error) {
        console.error('Error adding member:', error)
        throw error
      }
    },
    
    async removeMember(groupId, userId) {
      try {
        await deleteDoc(doc(db, 'groups', groupId, 'members', userId))
      } catch (error) {
        console.error('Error removing member:', error)
        throw error
      }
    },
    
    selectGroup(group) {
      this.selectedGroup = group
    },
  },
})

// Transaction Store
export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [],
  }),
  actions: {
    async addIncome(groupId, userId, createdBy, amount, month, title) {
      try {
        const transaction = {
          type: 'income',
          amount: Math.abs(amount),
          month: month, // format: "2026-04"
          title: title,
          userId: userId, // người đóng tiền
          createdBy: createdBy, // người tạo giao dịch
          createdAt: serverTimestamp()
        }
        
        await addDoc(collection(db, 'groups', groupId, 'transactions'), transaction)
      } catch (error) {
        console.error('Error adding income:', error)
        throw error
      }
    },
    
    async addExpense(groupId, createdBy, amount, title) {
      try {
        const transaction = {
          type: 'expense',
          amount: -Math.abs(amount), // expense luôn âm
          title: title,
          createdBy: createdBy,
          createdAt: serverTimestamp()
        }
        
        await addDoc(collection(db, 'groups', groupId, 'transactions'), transaction)
      } catch (error) {
        console.error('Error adding expense:', error)
        throw error
      }
    },
    
    async loadTransactions(groupId, month = null) {
      try {
        let q = query(
          collection(db, 'groups', groupId, 'transactions'),
          orderBy('createdAt', 'desc')
        )
        
        // Nếu có filter theo tháng
        if (month) {
          q = query(q, where('month', '==', month))
        }
        
        const snapshot = await getDocs(q)
        this.transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }))
        
        return this.transactions
      } catch (error) {
        console.error('Error loading transactions:', error)
        return []
      }
    },
    
    async deleteTransaction(groupId, transactionId) {
      try {
        await deleteDoc(doc(db, 'groups', groupId, 'transactions', transactionId))
        this.transactions = this.transactions.filter(t => t.id !== transactionId)
      } catch (error) {
        console.error('Error deleting transaction:', error)
        throw error
      }
    },
  },
  getters: {
    // Tính tổng thu theo tháng
    getTotalIncome: (state) => (month) => {
      return state.transactions
        .filter(t => t.type === 'income' && (!month || t.month === month))
        .reduce((sum, t) => sum + t.amount, 0)
    },
    
    // Tính tổng chi
    getTotalExpense: (state) => {
      return state.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    },
    
    // Số dư
    getBalance: (state) => {
      return state.transactions.reduce((sum, t) => sum + t.amount, 0)
    },
  },
})

// Invitation Store
export const useInvitationStore = defineStore('invitation', {
  state: () => ({
    invitations: [],
  }),
  actions: {
    async sendInvitation(groupId, groupName, inviterEmail, inviteeEmail) {
      try {
        // Kiểm tra xem user với email này có tồn tại không
        // Tạo invitation
        const invitationRef = await addDoc(collection(db, 'invitations'), {
          groupId,
          groupName,
          inviterEmail,
          inviteeEmail: inviteeEmail.toLowerCase().trim(),
          status: 'pending',
          createdAt: serverTimestamp()
        })
        
        return invitationRef.id
      } catch (error) {
        console.error('Error sending invitation:', error)
        throw error
      }
    },

    async loadInvitations(userEmail) {
      try {
        const q = query(
          collection(db, 'invitations'),
          where('inviteeEmail', '==', userEmail.toLowerCase().trim()),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        )
        
        const snapshot = await getDocs(q)
        this.invitations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        return this.invitations
      } catch (error) {
        console.error('Error loading invitations:', error)
        return []
      }
    },

    async acceptInvitation(invitationId, groupId) {
      try {
        const groupStore = useGroupStore()
        const userId = auth.currentUser.uid
        const email = auth.currentUser.email
        
        // Thêm user vào group
        await groupStore.addMember(groupId, userId, 'member', email)
        
        // Cập nhật status của invitation
        await updateDoc(doc(db, 'invitations', invitationId), {
          status: 'accepted'
        })
        
        // Remove từ local state
        this.invitations = this.invitations.filter(inv => inv.id !== invitationId)
        
        // Reload groups
        await groupStore.loadGroups(userId)
      } catch (error) {
        console.error('Error accepting invitation:', error)
        throw error
      }
    },

    async rejectInvitation(invitationId) {
      try {
        await updateDoc(doc(db, 'invitations', invitationId), {
          status: 'rejected'
        })
        
        // Remove từ local state
        this.invitations = this.invitations.filter(inv => inv.id !== invitationId)
      } catch (error) {
        console.error('Error rejecting invitation:', error)
        throw error
      }
    },
  },
})
