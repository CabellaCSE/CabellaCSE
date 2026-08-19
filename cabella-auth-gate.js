// ============================================================================
// CABELLA WORKSPACE GOOGLE AUTHENTICATION & ACCESS CONTROL MODULE
// Enforces mandatory sign-in with @cabellacollections.com Google Workspace accounts.
// ============================================================================

(function() {
  const ALLOWED_DOMAINS = ['cabellacollections.com'];

  const FIREBASE_CONFIG = {
    projectId: "cabella-client-portal",
    appId: "1:4095689649:web:ff50596175d30227b3f390",
    apiKey: "AIzaSyDh5Bv6mYc7Ju18J3DshIsJiNukrNhcnWw",
    authDomain: "cabella-client-portal.firebaseapp.com",
    storageBucket: "cabella-client-portal.firebasestorage.app",
    messagingSenderId: "4095689649",
    oAuthClientId: "4095689649-156b9vnibolcvgtmom4mi7i08oea27pl.apps.googleusercontent.com"
  };

  let fbApp = null;
  let fbAuth = null;
  let cachedAccessToken = null;
  let isSigningIn = false;

  // Initialize Firebase Client SDK
  function initFirebaseAuth() {
    if (typeof firebase !== 'undefined' && firebase.apps) {
      if (!firebase.apps.length) {
        fbApp = firebase.initializeApp(FIREBASE_CONFIG);
      } else {
        fbApp = firebase.apps[0];
      }
      fbAuth = firebase.auth();
      return true;
    }
    return false;
  }

  // Check if active user session is valid and allowed
  function getActiveCompanySession() {
    try {
      const raw = localStorage.getItem('cabella_authenticated_user_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.email) {
          const emailLower = session.email.toLowerCase().trim();
          const isAllowedDomain = ALLOWED_DOMAINS.some(d => emailLower.endsWith('@' + d));
          if (isAllowedDomain) {
            return session;
          }
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    return null;
  }

  function saveCompanySession(userData) {
    try {
      localStorage.setItem('cabella_authenticated_user_session', JSON.stringify(userData));
      
      // Synchronize with active user in portal
      if (typeof SYSTEM_USERS !== 'undefined') {
        const found = SYSTEM_USERS.find(u => 
          u.email.toLowerCase() === userData.email.toLowerCase() ||
          userData.email.toLowerCase().startsWith(u.name.toLowerCase().split(' ')[0])
        );
        if (found) {
          window.currentActiveUser = found;
          localStorage.setItem('cseActiveUser', JSON.stringify(found));
        } else {
          const customUser = {
            name: userData.name || userData.email.split('@')[0],
            role: 'Cabella Team Member',
            email: userData.email,
            access: 'Company Google Workspace Portal Access'
          };
          window.currentActiveUser = customUser;
          localStorage.setItem('cseActiveUser', JSON.stringify(customUser));
        }
      }
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  function clearCompanySession() {
    try {
      localStorage.removeItem('cabella_authenticated_user_session');
      localStorage.removeItem('cseActiveUser');
      cachedAccessToken = null;
      if (fbAuth) {
        fbAuth.signOut().catch(() => {});
      }
    } catch (e) {}
  }

  // Create & Inject Lock Screen UI
  function showCompanyLoginScreen(errorMessage = '') {
    let overlay = document.getElementById('cabellaCompanyLoginOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cabellaCompanyLoginOverlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999999;
        background: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        box-sizing: border-box;
      `;
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="background: #ffffff; width: 100%; max-width: 480px; border-radius: 16px; box-shadow: 0 25px 60px rgba(0,0,0,0.5); overflow: hidden; border: 1px solid #cbd5e1; text-align: center;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; color: #ffffff;">
          <div style="display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 14px; margin-bottom: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15)">
            <span style="font-size: 32px">🏢</span>
          </div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px">CABELLA COMMAND CENTER</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #e0f2fe; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px">Cabella Cabinets Stone & Flooring</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px 24px;">
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 6px">Company Google Workspace Sign-In Required</div>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5">
            This internal portal is restricted to authorized employees. Please sign in with your official <strong>@cabellacollections.com</strong> account to continue.
          </p>

          ${errorMessage ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; color: #991b1b; font-size: 12.5px; font-weight: 700; text-align: left; display: flex; align-items: flex-start; gap: 8px">
              <span style="font-size: 16px; line-height: 1">⚠️</span>
              <div style="flex: 1">${errorMessage}</div>
            </div>
          ` : ''}

          <!-- Google Sign-In Button -->
          <button id="googleWorkspaceLoginBtn" onclick="window.handleGoogleWorkspaceSignIn()" style="
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            background: #ffffff;
            color: #1f1f1f;
            border: 1.5px solid #747775;
            border-radius: 24px;
            padding: 12px 20px;
            font-size: 14.5px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#1f1f1f';" onmouseout="this.style.background='#ffffff'; this.style.borderColor='#747775';">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="width: 22px; height: 22px; display: block;">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <span>Sign in with Google Workspace</span>
          </button>

          <!-- Security note -->
          <div style="margin-top: 20px; font-size: 11.5px; color: #94a3b8; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 16px">
            🔒 Protected by Cabella Google Workspace Single Sign-On.<br>
            Non-company email addresses (@gmail.com, @yahoo.com, etc.) are strictly denied access.
          </div>
        </div>
      </div>
    `;
    overlay.style.display = 'flex';
  }

  function hideCompanyLoginScreen() {
    const overlay = document.getElementById('cabellaCompanyLoginOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  // Handle Google Workspace Sign-In Flow
  window.handleGoogleWorkspaceSignIn = async function() {
    const btn = document.getElementById('googleWorkspaceLoginBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span style="display:inline-block; animation:spin 1s infinite linear">⏳</span> <span>Connecting to Google...</span>`;
    }

    try {
      initFirebaseAuth();

      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Google Authentication service is loading. Please try again in a few seconds.');
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/gmail.compose');
      provider.setCustomParameters({
        hd: 'cabellacollections.com',
        prompt: 'select_account'
      });

      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      const credential = result.credential;
      if (credential && credential.accessToken) {
        cachedAccessToken = credential.accessToken;
      }

      const userEmail = (user.email || '').toLowerCase().trim();
      const isAllowed = ALLOWED_DOMAINS.some(d => userEmail.endsWith('@' + d));

      if (!isAllowed) {
        await firebase.auth().signOut();
        showCompanyLoginScreen(`Access Denied: <strong>${userEmail}</strong> is not a valid @cabellacollections.com company account. Please sign in with your official Cabella email.`);
        return;
      }

      const sessionData = {
        email: userEmail,
        name: user.displayName || userEmail.split('@')[0],
        photoURL: user.photoURL || '',
        uid: user.uid,
        loginTime: new Date().toISOString()
      };

      saveCompanySession(sessionData);
      hideCompanyLoginScreen();

      if (typeof updateHeaderUserBadge === 'function') updateHeaderUserBadge();
      if (typeof renderRoleBasedHomeModule === 'function') renderRoleBasedHomeModule();
      if (typeof showToast === 'function') {
        showToast(`✅ Welcome, ${sessionData.name}! Signed in via Google Workspace.`);
      }
      
      const greeting = document.getElementById('qboGreetingHeader');
      if (greeting) {
        greeting.textContent = `Good afternoon, ${sessionData.name.split(' ')[0]}!`;
      }

    } catch (err) {
      console.error('Google Sign-In Error:', err);
      let msg = err.message || 'Google Sign-In was cancelled or could not be completed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing. Please try again.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Sign-in process was interrupted. Please click again.';
      }
      showCompanyLoginScreen(msg);
    }
  };

  // Sign out handler
  window.handleCompanySignOut = async function() {
    clearCompanySession();
    showCompanyLoginScreen();
    if (typeof showToast === 'function') showToast('Signed out of Cabella Command Center.');
  };

  // Update header badge with live auth user info
  window.updateHeaderUserBadge = function() {
    const session = getActiveCompanySession();
    const badgeContainer = document.getElementById('headerUserBadgeContainer');
    if (!badgeContainer) return;

    if (!session) {
      badgeContainer.innerHTML = `
        <div style="width:26px; height:26px; border-radius:50%; background:#64748b; color:#fff; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center">🔒</div>
        <div style="display:flex; flex-direction:column; line-height:1.1">
          <div style="font-size:12px; font-weight:800; color:#0f172a">Not Signed In</div>
          <div style="font-size:9.5px; color:#ef4444; font-weight:700">🔴 Click to Sign In</div>
        </div>
      `;
      badgeContainer.onclick = function() { showCompanyLoginScreen(); };
      return;
    }

    const initials = session.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CB';
    badgeContainer.innerHTML = `
      <div style="width:26px; height:26px; border-radius:50%; background:#0b57d0; color:#fff; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center">${initials}</div>
      <div style="display:flex; flex-direction:column; line-height:1.1">
        <div style="font-size:12px; font-weight:800; color:#0f172a">${session.name}</div>
        <div style="font-size:9.5px; color:#0b57d0; font-weight:700">🟢 Google Workspace</div>
      </div>
    `;
    badgeContainer.onclick = function() {
      if (typeof openSettingsModal === 'function') {
        openSettingsModal('permissions');
      }
    };
  };

  // Startup Gatekeeper Verification
  function enforceAccessGate() {
    const session = getActiveCompanySession();
    if (!session) {
      showCompanyLoginScreen();
    } else {
      hideCompanyLoginScreen();
      saveCompanySession(session); // Sync active user
      window.updateHeaderUserBadge();
    }
  }

  // Expose Token Getter for Workspace Integrations
  window.getCabellaAccessToken = async function() {
    if (cachedAccessToken) return cachedAccessToken;
    if (fbAuth && fbAuth.currentUser) {
      try {
        const token = await fbAuth.currentUser.getIdToken(true);
        return token;
      } catch (e) {}
    }
    return null;
  };

  window.getActiveCompanySession = getActiveCompanySession;

  // Run initial check on script load and DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceAccessGate);
  } else {
    enforceAccessGate();
  }

})();
