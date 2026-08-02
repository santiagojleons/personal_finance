// ── AUTH ──────────────────────────────────────────────────────────────────
async function doLogin(){
  var msg = document.getElementById('authMsg');
  var btn = document.querySelector('#loginForm button[type=submit]');
  msg.style.color = '#6b7a99';
  msg.textContent = 'Signing in...';
  if(btn) btn.disabled = true;
  try {
    var {data, error} = await sb.auth.signInWithPassword({
      email: document.getElementById('authEmail').value.trim(),
      password: document.getElementById('authPass').value
    });
    if(error) throw error;
    await initApp(data.user);
  } catch(e) {
    msg.style.color = '#f87171';
    msg.textContent = (e.message || 'Incorrect email or password.');
    if(btn) btn.disabled = false;
  }
}

async function doSignup(){
  // First click: reveal name field
  var nameRow = document.getElementById('signupNameRow');
  var confirmBtn = document.getElementById('signupConfirmBtn');
  if(nameRow.style.display === 'none'){
    nameRow.style.display = 'block';
    confirmBtn.style.display = 'block';
    document.getElementById('authMsg').textContent = 'Enter your first name to continue.';
    return;
  }
}

async function doSignupConfirm(){
  var firstName = document.getElementById('authName').value.trim();
  if(!firstName){ document.getElementById('authMsg').textContent = 'Please enter your first name.'; return; }
  var {error} = await sb.auth.signUp({
    email: document.getElementById('authEmail').value,
    password: document.getElementById('authPass').value,
    options: { data: { display_name: firstName, first_name: firstName } }
  });
  if(error){ document.getElementById('authMsg').textContent = error.message; }
  else { document.getElementById('authMsg').textContent = 'Check your email to confirm your account!'; }
}

async function doLogout(){
  await sb.auth.signOut();
  window.location.reload();
}

// ── PASSKEYS ───────────────────────────────────────────────────────────────
async function signInWithPasskey(){
  var msg = document.getElementById('authMsg');
  try {
    msg.style.color = '#6b7a99';
    msg.textContent = 'Waiting for biometric...';
    var { data, error } = await sb.auth.signInWithPasskey({ rpId: window.location.hostname });
    if(error) throw error;
    await initApp(data.user);
  } catch(e) {
    var errMsg = e.message || '';
    msg.style.color = errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('abort') ? '#6b7a99' : '#f87171';
    msg.textContent = errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('abort')
      ? 'Cancelled.'
      : 'Passkey sign-in failed. Try password instead.';
  }
}

async function toggleNotifications(){
  var btn = document.getElementById('notifBtn');
  if(typeof OneSignal === 'undefined'){
    alert('Notifications not available. Make sure you are on the live site (not file://) and try again.');
    return;
  }
  try {
    var permission = await OneSignal.Notifications.permission;
    if(permission){
      // Already subscribed — offer to unsubscribe
      if(confirm('Disable push notifications for Budget Tracker?')){
        await OneSignal.User.PushSubscription.optOut();
        updateNotifBtn(false);
      }
    } else {
      // Not subscribed — request permission
      await OneSignal.Notifications.requestPermission();
      var granted = await OneSignal.Notifications.permission;
      updateNotifBtn(granted);
      if(granted){
        // Tag user with their Supabase ID so we can target them later
        if(currentUser) OneSignal.User.addTag('user_id', currentUser.id);
      }
    }
  } catch(e) {
    console.error('Notification error:', e);
    alert('Could not set up notifications: ' + (e.message || e));
  }
}

function updateNotifBtn(enabled){
  var btn = document.getElementById('notifBtn');
  if(!btn) return;
  if(enabled){
    btn.style.color = '#ffffff';
    btn.style.borderColor = 'rgba(255,255,255,0.14)';
    btn.style.background = 'rgba(255,255,255,0.03)';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> Notifications On';
  } else {
    btn.style.color = 'var(--text2)';
    btn.style.borderColor = 'var(--border2)';
    btn.style.background = 'transparent';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> Enable Notifications';
  }
}

// Check notification status on load and update button
function checkNotifStatus(){
  if(typeof OneSignal === 'undefined') return;
  OneSignalDeferred.push(async function(OneSignal){
    var enabled = await OneSignal.Notifications.permission;
    updateNotifBtn(enabled);
  });
}

async function registerPasskey(){
  var btn = document.getElementById('registerPasskeyBtn');
  var origText = btn ? btn.innerHTML : '';
  if(btn){ btn.textContent = 'Waiting for biometric...'; btn.disabled = true; }
  try {
    // Pass the correct RP ID based on current hostname
    var rpId = window.location.hostname; // 'localhost' or 'santiagojleons.github.io'
    var { data, error } = await sb.auth.registerPasskey({ rpId: rpId });
    if(error) throw error;
    alert('Face ID / Touch ID registered! You can now sign in with biometrics.');
  } catch(e) {
    var msg = e.message || 'Unknown error';
    var lower = msg.toLowerCase();
    if(lower.includes('cancel') || lower.includes('abort') || lower.includes('not allowed')){
      // User cancelled or browser blocked - silent
    } else if(lower.includes('invalid domain') || lower.includes('rpid')){
      alert('Passkey domain mismatch.\n\nMake sure your Supabase Passkey settings match:\n• RP ID: ' + window.location.hostname + '\n• Origin: ' + window.location.origin);
    } else {
      alert('Could not register passkey: ' + msg);
    }
  }
  if(btn){ btn.innerHTML = origText; btn.disabled = false; }
}

// ── INIT ──────────────────────────────────────────────────────────────────
function hideLoader(){ var l=document.getElementById('appLoader'); if(l) l.style.display='none'; }

async function initApp(user){
  try {
    currentUser = user;
    if(currentUser){
      STATE = initState();
      await loadState();
      ensureMonth(STATE.activeMonth, null);
      loadMonthIntoUI();
      CURRENT_TAB = 'dashboard';
      checkNotifStatus();
      var firstName = currentUser.user_metadata?.display_name || currentUser.user_metadata?.first_name || '';
      // Update the animated title phrases to use the user's name
      if(firstName){
        DASH_TITLE_PHRASES = [
          'Your Finances, ' + firstName,
          'Your Savings, ' + firstName,
          'Your Future, ' + firstName,
          'Your Budget, ' + firstName,
          'Your Goals, ' + firstName
        ];
      }
      hideLoader();
      document.getElementById('authScreen').style.display = 'none';
      document.querySelector('.shell').style.display = 'grid';
      var _nav=document.getElementById('mobileNav');if(_nav)_nav.style.display='flex';
      switchTab('dashboard');
    } else {
      hideLoader();
      document.getElementById('authScreen').style.display = 'flex';
      document.querySelector('.shell').style.display = 'none';
      var _nav=document.getElementById('mobileNav');if(_nav)_nav.style.display='none';
    }
  } catch(e) {
    console.error('initApp error:', e);
    hideLoader();
    document.getElementById('authScreen').style.display = 'flex';
    document.querySelector('.shell').style.display = 'none';
      var _nav=document.getElementById('mobileNav');if(_nav)_nav.style.display='none';
  }
}

function showLogin(){
  hideLoader();
  document.getElementById('authScreen').style.display = 'flex';
  document.querySelector('.shell').style.display = 'none';
      var _nav=document.getElementById('mobileNav');if(_nav)_nav.style.display='none';
}

function showSettingsEmail(){
  var el=document.getElementById('settingsEmail');
  if(el && currentUser && currentUser.email) el.textContent=currentUser.email;
}

// Check for existing session immediately on load
// On load: check for saved session once
sb.auth.getSession().then(({ data: { session } }) => {
  initApp(session?.user ?? null);
}).catch(function(){
  showLogin();
});

// Safety net: 6s max loader time
setTimeout(function(){
  var l = document.getElementById('appLoader');
  if(l && l.style.display !== 'none') showLogin();
}, 6000);

// Only handle signout via onAuthStateChange - login handled directly by doLogin
sb.auth.onAuthStateChange(function(event, session){
  if(event === 'SIGNED_OUT') showLogin();
});
