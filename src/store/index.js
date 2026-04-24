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
  serverTimestamp 
} from 'firebase/firestore'

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
        
        // Thêm owner vào members
        await setDoc(doc(db, 'groups', groupRef.id, 'members', userId), {
          role: 'owner',
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
        this.groups = []
        // Lấy tất cả groups
        const groupsSnapshot = await getDocs(collection(db, 'groups'))
        
        // Kiểm tra user có phải member của group không
        for (const groupDoc of groupsSnapshot.docs) {
          const memberDoc = await getDoc(doc(db, 'groups', groupDoc.id, 'members', userId))
          if (memberDoc.exists()) {
            this.groups.push({
              id: groupDoc.id,
              ...groupDoc.data()
            })
          }
        }
      } catch (error) {
        console.error('Error loading groups:', error)
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
    
    async addMember(groupId, userId, role = 'member') {
      try {
        await setDoc(doc(db, 'groups', groupId, 'members', userId), {
          role: role,
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