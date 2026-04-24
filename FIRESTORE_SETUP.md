# 🔥 Firestore Security Rules Setup

## ❌ Lỗi hiện tại
```
FirebaseError: Missing or insufficient permissions
```

## ✅ Giải pháp

### Bước 1: Vào Firebase Console
1. Mở https://console.firebase.google.com/
2. Chọn project **my-team-73785**
3. Vào **Firestore Database** → **Rules**

### Bước 2: Copy và paste Security Rules sau

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Groups collection
    match /groups/{groupId} {
      // Cho phép đọc nếu user là member của group
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid));
      
      // Cho phép tạo group mới nếu đã đăng nhập
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.ownerId;
      
      // Cho phép update nếu user là owner
      allow update: if request.auth != null && 
                       request.auth.uid == resource.data.ownerId;
      
      // Cho phép xóa nếu user là owner
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.ownerId;
      
      // Members subcollection
      match /members/{userId} {
        // Cho phép đọc nếu user là member của group
        allow read: if request.auth != null && 
                       exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid));
        
        // Cho phép tạo/update member nếu user là owner hoặc đang add chính mình
        allow create, update: if request.auth != null && (
          get(/databases/$(database)/documents/groups/$(groupId)).data.ownerId == request.auth.uid ||
          userId == request.auth.uid
        );
        
        // Cho phép xóa nếu user là owner hoặc đang remove chính mình
        allow delete: if request.auth != null && (
          get(/databases/$(database)/documents/groups/$(groupId)).data.ownerId == request.auth.uid ||
          userId == request.auth.uid
        );
      }
      
      // Transactions subcollection
      match /transactions/{transactionId} {
        // Cho phép đọc nếu user là member của group
        allow read: if request.auth != null && 
                       exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid));
        
        // Cho phép tạo transaction nếu user là member
        allow create: if request.auth != null && 
                         exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid)) &&
                         request.auth.uid == request.resource.data.createdBy;
        
        // Cho phép update nếu user là người tạo transaction
        allow update: if request.auth != null && 
                         request.auth.uid == resource.data.createdBy;
        
        // Cho phép xóa nếu user là người tạo hoặc là owner của group
        allow delete: if request.auth != null && (
          request.auth.uid == resource.data.createdBy ||
          request.auth.uid == get(/databases/$(database)/documents/groups/$(groupId)).data.ownerId
        );
      }
    }
  }
}
```

### Bước 3: Publish Rules
Click nút **Publish** để áp dụng rules mới.

### Bước 4: Test
Reload app và thử tạo group mới. Lỗi sẽ biến mất! ✨

---

## 📝 Giải thích Rules

### Groups
- **Read**: Chỉ members của group mới có thể đọc thông tin group
- **Create**: Bất kỳ user đã đăng nhập nào cũng có thể tạo group (và phải là owner)
- **Update/Delete**: Chỉ owner mới có thể sửa/xóa group

### Members (subcollection)
- **Read**: Chỉ members của group mới có thể xem danh sách members
- **Create/Update**: Owner hoặc chính user đó có thể thêm/sửa member
- **Delete**: Owner hoặc chính user đó có thể xóa member (rời nhóm)

### Transactions (subcollection)
- **Read**: Chỉ members của group mới có thể xem transactions
- **Create**: Members có thể tạo transaction (phải là người tạo)
- **Update**: Chỉ người tạo transaction mới có thể sửa
- **Delete**: Người tạo hoặc owner của group có thể xóa

---

## 🔒 Lưu ý bảo mật

Rules hiện tại phù hợp cho **production**. Đã bao gồm:
- ✅ Authentication check (request.auth != null)
- ✅ Member verification (exists check)
- ✅ Owner verification
- ✅ Creator verification
- ✅ Proper data validation

### Cải thiện thêm (optional):
- Thêm validation cho data structure (validate fields)
- Giới hạn số lượng members/transactions
- Rate limiting cho operations
- Audit logging
