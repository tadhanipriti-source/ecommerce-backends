
/* ============================================
   AUTH MODULE — Login, Register, User State
   ============================================ */

const Auth = (() => {
  let user = null;
  let wishlistIds = [];

  // Get user information
  const getUser = () => user;
  const getWishlist = () => wishlistIds;
  const isLoggedIn = () => !!user;

  // Set user information
  const setUser = (u) => {
    user = u || null;

    wishlistIds = (user?.wishlist || []).map(
      (w) => w._id || w
    );

    updateNavUI();
  };

  // Update Navbar
  const updateNavUI = () => {
    const navUser = document.getElementById('nav-user');
    const avatarWrap = document.getElementById('user-avatar-wrap');
    const initialEl = document.getElementById('user-initial');
    const nameEl = document.getElementById('dropdown-name');
    const emailEl = document.getElementById('dropdown-email');
    const wishCount = document.getElementById('wishlist-count');

    if (user) {
      if (navUser) navUser.classList.add('hidden');
      if (avatarWrap) avatarWrap.classList.remove('hidden');

      if (initialEl) {
        initialEl.textContent = user.name
          ? user.name[0].toUpperCase()
          : 'U';
      }

      if (nameEl) nameEl.textContent = user.name || '';
      if (emailEl) emailEl.textContent = user.email || '';

      if (wishCount) {
        wishCount.textContent = wishlistIds.length;
        wishCount.style.display = wishlistIds.length ? 'flex' : 'none';
      }
    } else {
      if (navUser) navUser.classList.remove('hidden');
      if (avatarWrap) avatarWrap.classList.add('hidden');
      if (wishCount) wishCount.style.display = 'none';
    }
  };

  // Login
  const login = async (email, password) => {
    const data = await API.auth.login({
      email,
      password
    });

    if (data.token) {
      API.setToken(data.token);
    }

    setUser(data.data || data.user);

    UI.toast('Welcome back! 👋', 'success');
    UI.hideAllModals();

    await Cart.syncFromBackend();

    return data;
  };

  // Register
  const register = async (name, email, password) => {
    const data = await API.auth.register({
      name,
      email,
      password
    });

    if (data.token) {
      API.setToken(data.token);
    }

    setUser(data.data || data.user);

    UI.toast('Account created! Welcome to NEXUS 🎉', 'success');
    UI.hideAllModals();

    return data;
  };

  // Logout
  const logout = async () => {
    try {
      await API.auth.logout();
    } catch (err) {
      console.log('Logout API error:', err.message);
    }

    API.setToken(null);
    setUser(null);
    Cart.clear();

    UI.toast('Signed out. See you soon!', 'info');
  };

  // Fetch logged-in user
  const fetchMe = async () => {
    if (!API.getToken()) return;

    try {
      const data = await API.auth.getMe();

      setUser(data.data || data.user);
    } catch (err) {
      API.setToken(null);
      setUser(null);
    }
  };

  // Wishlist
  const toggleWishlist = async (productId) => {
    if (!isLoggedIn()) {
      UI.showModal('auth-modal');
      UI.toast('Please sign in to save to wishlist', 'info');
      return false;
    }

    try {
      const data = await API.auth.toggleWishlist(productId);

      const wishlist = data.data?.wishlist || [];

      wishlistIds = wishlist.map(
        (w) => w._id || w
      );

      user.wishlist = wishlist;

      updateNavUI();

      return wishlistIds.includes(productId);

    } catch (err) {
      UI.toast(err.message, 'error');
      return false;
    }
  };

  // Initialize Login and Register Forms
  const initAuthForms = () => {

    // Login Form
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('login-submit');

        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Signing in…';
        }

        try {
          await login(
            document.getElementById('login-email').value,
            document.getElementById('login-password').value
          );

        } catch (err) {
          UI.toast(err.message, 'error');

        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Sign In';
          }
        }
      });
    }

    // Register Form
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pass = document.getElementById('reg-password').value;

        if (pass.length < 6) {
          UI.toast(
            'Password must be at least 6 characters',
            'error'
          );
          return;
        }

        const btn = document.getElementById('register-submit');

        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Creating account…';
        }

        try {
          await register(
            document.getElementById('reg-name').value,
            document.getElementById('reg-email').value,
            pass
          );

        } catch (err) {
          UI.toast(err.message, 'error');

        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Create Account';
          }
        }
      });
    }

    // Login Tab
    const loginTab = document.getElementById('tab-login');

    if (loginTab) {
      loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');

        document.getElementById('tab-register')?.classList.remove('active');
        document.getElementById('login-form')?.classList.remove('hidden');
        document.getElementById('register-form')?.classList.add('hidden');
      });
    }

    // Register Tab
    const registerTab = document.getElementById('tab-register');

    if (registerTab) {
      registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');

        document.getElementById('tab-login')?.classList.remove('active');
        document.getElementById('register-form')?.classList.remove('hidden');
        document.getElementById('login-form')?.classList.add('hidden');
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await logout();

        document.getElementById('user-dropdown')
          ?.classList.remove('show');
      });
    }

    // User Avatar Toggle
    const avatarBtn = document.getElementById('user-avatar-btn');

    if (avatarBtn) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        document.getElementById('user-dropdown')
          ?.classList.toggle('show');
      });
    }

    // Close Dropdown Outside Click
    document.addEventListener('click', () => {
      document.getElementById('user-dropdown')
        ?.classList.remove('show');
    });

    // Password Eye Toggle
    document.querySelectorAll('.eye-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);

        if (inp) {
          inp.type = inp.type === 'password'
            ? 'text'
            : 'password';
        }
      });
    });

    // Login Button
    const loginBtn = document.getElementById('login-btn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        document.getElementById('tab-login')?.click();
        UI.showModal('auth-modal');
      });
    }

    // Register Button
    const registerBtn = document.getElementById('register-btn');

    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        document.getElementById('tab-register')?.click();
        UI.showModal('auth-modal');
      });
    }

    // Mobile Login Button
    const mLogin = document.getElementById('m-login-btn');

    if (mLogin) {
      mLogin.addEventListener('click', (e) => {
        e.preventDefault();

        if (typeof App !== 'undefined') {
          App.closeMobileSidebar();
        }

        UI.showModal('auth-modal');
      });
    }

    // Close Auth Modal
    const authClose = document.getElementById('auth-modal-close');

    if (authClose) {
      authClose.addEventListener('click', () => {
        UI.hideAllModals();
      });
    }
  };

  return {
    getUser,
    getWishlist,
    isLoggedIn,
    setUser,
    login,
    logout,
    fetchMe,
    toggleWishlist,
    initAuthForms
  };

})();
