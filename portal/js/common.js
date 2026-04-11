// ★★★ ここにFirebaseの鍵を貼り付けます ★★★
const firebaseConfig = {
    apiKey: "AIzaSyD69OZD1USbhG4ndQZPdv5CpUZwXL5pRmQ",
    authDomain: "watensai-portal.firebaseapp.com",
    projectId: "watensai-portal",
    storageBucket: "watensai-portal.firebasestorage.app",
    messagingSenderId: "332659532540",
    appId: "1:332659532540:web:8c1e07bf16b78d4bf5ed79",
    measurementId: "G-NV3R12J12R"
  };

// Firebaseの初期化（重複起動を防ぐ処理付き）
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let currentUserRole = ""; 
let currentUserEmail = "";

// どこからでもログを残せる共通関数
function addOperationLog(actionDetail, isSecurityAlert = false, isHiddenFromAdmin = false) { 
    db.collection("operation_logs").add({ userEmail: currentUserEmail, action: actionDetail, isSecurityAlert: isSecurityAlert, isHiddenFromAdmin: isHiddenFromAdmin, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); 
}

// 認証チェックとサイドバーの表示制御
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        currentUserEmail = user.email; 
        if(document.getElementById('user-email')) document.getElementById('user-email').innerText = user.email;
        
        const userRef = db.collection("users").doc(user.uid);
        userRef.get().then((doc) => {
            if (doc.exists) {
                let data = doc.data(); currentUserRole = data.role;
                if (data.expiresAt && new Date() > new Date(data.expiresAt)) { 
                    currentUserRole = "general"; 
                    userRef.update({ role: "general", expiresAt: firebase.firestore.FieldValue.delete() }); 
                    addOperationLog("期限切れのため " + user.email + " を一般局員に戻しました"); 
                }
            } else { 
                currentUserRole = "pending"; 
                userRef.set({ email: user.email, role: "pending", createdAt: firebase.firestore.FieldValue.serverTimestamp() }); 
            }

            if(document.getElementById('auth-guard')) document.getElementById('auth-guard').style.display = 'none';
            
            if (currentUserRole === "pending") { if(document.getElementById('pending-screen')) document.getElementById('pending-screen').style.display = 'flex'; return; }
            if (currentUserRole === "rejected") { if(document.getElementById('rejected-screen')) document.getElementById('rejected-screen').style.display = 'flex'; return; }

            // 無事にログインできて権限があれば画面を表示
            if(document.getElementById('sidebar')) document.getElementById('sidebar').style.display = 'flex'; 
            if(document.getElementById('content-wrapper')) document.getElementById('content-wrapper').style.display = 'flex';
            
            const displayRole = (currentUserRole === "superuser") ? "管理者" : (currentUserRole === "admin") ? "管理者" : (currentUserRole === "content_admin") ? "コンテンツ管理者" : "一般局員";
            if(document.getElementById('user-role-display')) document.getElementById('user-role-display').innerText = "権限: " + displayRole;

            // 管理者だけに表示するメニュー
            if(currentUserRole === "superuser" || currentUserRole === "admin") { 
                if(document.getElementById('menu-admin')) document.getElementById('menu-admin').style.display = "block"; 
            }

            // ★そのページ専用の読み込み処理（initPage）があれば実行する
            if (typeof initPage === 'function') {
                initPage();
            }
        });
    } else { 
        window.location.replace('index.html'); 
    }
});

// サイドバーとUIの共通操作
window.toggleSidebar = function() { const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('overlay'); if (window.innerWidth <= 768) { sidebar.classList.toggle('mobile-open'); overlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none'; } else { sidebar.classList.toggle('collapsed'); } };
window.closeSidebarMobile = function() { if (window.innerWidth <= 768) { document.getElementById('sidebar').classList.remove('mobile-open'); document.getElementById('overlay').style.display = 'none'; } };
window.toggleVisibility = function(t, b) { const x = document.getElementById(t); if (x.style.display === "none") { x.style.display = "block"; b.innerText = "🙈"; b.style.backgroundColor = "#e74c3c"; } else { x.style.display = "none"; b.innerText = "👁️"; b.style.backgroundColor = "#7f8c8d"; } };