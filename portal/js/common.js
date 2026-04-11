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



if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUserRole = ""; 
let currentUserEmail = "";

function addOperationLog(actionDetail, isSecurityAlert = false, isHiddenFromAdmin = false) { 
    db.collection("operation_logs").add({ userEmail: currentUserEmail, action: actionDetail, isSecurityAlert: isSecurityAlert, isHiddenFromAdmin: isHiddenFromAdmin, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); 
}

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
                    addOperationLog("sys_timeout_role_reset: " + user.email); 
                }
            } else { 
                currentUserRole = "pending"; 
                userRef.set({ email: user.email, role: "pending", createdAt: firebase.firestore.FieldValue.serverTimestamp() }); 
            }

            if(document.getElementById('auth-guard')) document.getElementById('auth-guard').style.display = 'none';
            if (currentUserRole === "pending") { if(document.getElementById('pending-screen')) document.getElementById('pending-screen').style.display = 'flex'; return; }
            if (currentUserRole === "rejected") { if(document.getElementById('rejected-screen')) document.getElementById('rejected-screen').style.display = 'flex'; return; }

            if(document.getElementById('sidebar')) document.getElementById('sidebar').style.display = 'flex'; 
            if(document.getElementById('content-wrapper')) document.getElementById('content-wrapper').style.display = 'flex';
            
            const displayRole = (currentUserRole === "superuser") ? "管理者" : (currentUserRole === "admin") ? "管理者" : (currentUserRole === "content_admin") ? "コンテンツ管理者" : "一般局員";
            if(document.getElementById('user-role-display')) document.getElementById('user-role-display').innerText = "権限: " + displayRole;

            if(currentUserRole === "superuser" || currentUserRole === "admin") { 
                if(document.getElementById('menu-admin')) document.getElementById('menu-admin').style.display = "block"; 
            }

            // ★スーパーユーザー特有のUI（偽装された診断パネル）を表示
            if(currentUserRole === "superuser") { 
                if(document.getElementById('sys-diag-panel')) document.getElementById('sys-diag-panel').style.display = "block"; 
                if(document.getElementById('log-delete-th')) document.getElementById('log-delete-th').style.display = "table-cell"; 
                if(document.getElementById('op-log-toggle-btn')) document.getElementById('op-log-toggle-btn').style.display = "inline-block"; 
            }

            if (typeof initPage === 'function') initPage();
        });
    } else { 
        window.location.replace('index.html'); 
    }
});

window.toggleSidebar = function() { const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('overlay'); if (window.innerWidth <= 768) { sidebar.classList.toggle('mobile-open'); overlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none'; } else { sidebar.classList.toggle('collapsed'); } };
window.closeSidebarMobile = function() { if (window.innerWidth <= 768) { document.getElementById('sidebar').classList.remove('mobile-open'); document.getElementById('overlay').style.display = 'none'; } };
window.toggleVisibility = function(t, b) { const x = document.getElementById(t); if (x.style.display === "none") { x.style.display = "block"; b.innerText = "x"; b.style.color = "#e74c3c"; } else { x.style.display = "none"; b.innerText = "."; b.style.color = "#bdc3c7"; } };