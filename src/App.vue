<template>
  <div id="app">
    <div v-if="user" class="dashboard">
      <header>
        <h1>Team Fund Manager</h1>
        <div class="user-info">
          <span>{{ user.email }}</span>
          <button @click="signOut" class="btn btn-outline">Sign Out</button>
        </div>
      </header>
      <main>
        <router-view></router-view>
      </main>
    </div>
    <div v-else class="login-page">
      <div class="login-container">
        <h1>Team Fund Manager</h1>
        <p>Please sign in to access the app.</p>
        <button @click="signIn" class="btn btn-primary" :disabled="isSigningIn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
          {{ isSigningIn ? 'Signing in...' : 'Sign In with Google' }}
        </button>
        <button @click="signInDemo" class="btn btn-secondary" :disabled="isSigningIn">
          Use Demo Account
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { auth } from './firebase/config'
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const user = ref(null)
    const router = useRouter()
    const isSigningIn = ref(false)

    const signIn = async () => {
      if (isSigningIn.value) return
      
      isSigningIn.value = true
      try {
        console.log('Attempting to sign in with Google (popup method)');
        const provider = new GoogleAuthProvider()
        
        // Thử popup trước
        try {
          const result = await signInWithPopup(auth, provider)
          console.log('Google sign-in successful (popup):', result.user.email);
          isSigningIn.value = false
        } catch (popupError) {
          console.log('Popup failed, trying redirect...', popupError.code);
          // Nếu popup fail, dùng redirect
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request') {
            await signInWithRedirect(auth, provider)
          } else {
            throw popupError
          }
        }
      } catch (error) {
        console.error('Error signing in:', error)
        alert('Failed to sign in: ' + error.message)
        isSigningIn.value = false
      }
    }

    const signInDemo = async () => {
      try {
        console.log('Attempting to sign in with demo account');
        await signInWithEmailAndPassword(auth, 'demo@example.com', 'password123')
        console.log('Demo account sign-in successful');
      } catch (error) {
        console.error('Error signing in with demo account:', error)
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          alert('Demo account chưa được tạo trong Firebase.\n\nVui lòng:\n1. Vào Firebase Console → Authentication → Users\n2. Add user: demo@example.com / password123\n\nHoặc sử dụng Google Sign-in.')
        } else {
          alert('Failed to sign in with demo account: ' + error.message)
        }
      }
    }

    const signOutUser = async () => {
      try {
        await signOut(auth)
        router.push('/')
      } catch (error) {
        console.error('Error signing out:', error)
      }
    }

    onMounted(async () => {
      console.log('App mounted, checking redirect result...');
      
      // Xử lý kết quả redirect từ Google sign-in
      try {
        const result = await getRedirectResult(auth)
        console.log('Redirect result:', result);
        if (result) {
          console.log('Google sign-in successful after redirect, user:', result.user.email);
        } else {
          console.log('No redirect result found (normal on first load)');
        }
      } catch (error) {
        console.error('Error handling redirect result:', error)
        alert('Lỗi khi xử lý đăng nhập: ' + error.message)
      }

      auth.onAuthStateChanged((currentUser) => {
        console.log('Auth state changed, current user:', currentUser?.email || 'null');
        user.value = currentUser
      })
    })

    return {
      user,
      signIn,
      signInDemo,
      signOut: signOutUser,
      isSigningIn
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Login Page */
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 15s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.login-container {
  background: white;
  padding: 3rem 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  width: 100%;
  position: relative;
  z-index: 1;
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

.login-container h1 {
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-container p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem 0;
  width: 100%;
  border: none;
  position: relative;
  overflow: hidden;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary {
  background: linear-gradient(135deg, #4285f4 0%, #3367d6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(66, 133, 244, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 133, 244, 0.6);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: white;
  color: #757575;
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  background-color: transparent;
  color: #4285f4;
  border: 2px solid #4285f4;
}

.btn-outline:hover {
  background-color: #4285f4;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.btn img {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

/* Dashboard */
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f7fa;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2.5rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #333;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info span {
  color: #555;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 0.9rem;
}

main {
  flex-grow: 1;
  padding: 2.5rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* Responsive */
@media (max-width: 768px) {
  .login-container {
    padding: 2rem 1.5rem;
  }
  
  header {
    padding: 1rem 1.5rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  header h1 {
    font-size: 1.5rem;
  }
  
  main {
    padding: 1.5rem;
  }
}
</style>
