// ── ChainFlow SCM | Auth & Role Manager ──

const AUTH_KEY = 'chainflow_auth';

const ROLES = {
  admin: {
    label: 'Administrator',
    permissions: {
      viewDashboard: true,
      viewProducts: true,
      addProduct: true,
      editProduct: true,
      deleteProduct: true,
      viewOrders: true,
      addOrder: true,
      editOrder: true,
      deleteOrder: true,
      viewShipments: true,
      addShipment: true,
      editShipment: true,
      deleteShipment: true,
      viewPartners: true,
      addPartner: true,
      editPartner: true,
      deletePartner: true,
      viewWarehouses: true,
      addWarehouse: true,
      viewAnalytics: true,
      viewReports: true,
      viewSettings: true,
    }
  },
  user: {
    label: 'Operator',
    permissions: {
      viewDashboard: true,
      viewProducts: true,
      addProduct: false,
      editProduct: false,
      deleteProduct: false,
      viewOrders: true,
      addOrder: true,
      editOrder: false,
      deleteOrder: false,
      viewShipments: true,
      addShipment: false,
      editShipment: false,
      deleteShipment: false,
      viewPartners: true,
      addPartner: false,
      editPartner: false,
      deletePartner: false,
      viewWarehouses: true,
      viewAnalytics: false,
      viewReports: false,
      viewSettings: false,
    }
  }
};

function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function setSession(username, role) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ username, role, loginTime: new Date().toISOString() }));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

function can(permission) {
  const session = getSession();
  if (!session) return false;
  const role = ROLES[session.role];
  return role ? !!role.permissions[permission] : false;
}

function signOut() {
  clearSession();
  window.location.href = 'login.html';
}

// Apply role-based UI restrictions after page loads
function applyPermissions() {
  const session = getSession();
  if (!session) return;

  // Update user display in sidebar
  const nameEl = document.querySelector('.user-name');
  const roleEl = document.querySelector('.user-role');
  const roleTagEl = document.getElementById('role-tag');
  if (nameEl) nameEl.textContent = session.username;
  if (roleEl) roleEl.textContent = ROLES[session.role]?.label || session.role;
  if (roleTagEl) {
    roleTagEl.textContent = ROLES[session.role]?.label || session.role;
    roleTagEl.className = 'badge ' + (session.role === 'admin' ? 'primary' : 'success');
  }

  // Hide elements that require permissions
  document.querySelectorAll('[data-permission]').forEach(el => {
    const perm = el.getAttribute('data-permission');
    if (!can(perm)) {
      el.style.display = 'none';
    }
  });

  // Restrict nav items for non-admin
  if (session.role !== 'admin') {
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = 'none';
    });
  }
}
