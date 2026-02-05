/**
 * layout.js — Main Layout Component
 * Handles header, navigation, sidebar, and responsive layout
 */

const Layout = {
  // Resolve path based on current location
  resolvePath: function(href) {
    var currentPath = window.location.pathname;
    var currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    
    // If href starts with ../ or ./ or /, use as is
    if (href.indexOf('../') === 0 || href.indexOf('./') === 0 || href.indexOf('/') === 0) {
      return href;
    }
    
    // If in subfolder (e.g., resident/, admin/)
    if (currentDir.indexOf('/resident/') >= 0 || 
        currentDir.indexOf('/admin/') >= 0 ||
        currentDir.indexOf('/committee/') >= 0 ||
        currentDir.indexOf('/accounting/') >= 0 ||
        currentDir.indexOf('/executive/') >= 0 ||
        currentDir.indexOf('/applicant/') >= 0) {
      // Paths in public/ root
      if (href === 'index.html' || href === 'login.html' || href === 'register.html') {
        return '../../' + href;
      }
      // Paths in same subfolder
      if (href.indexOf('resident/') === 0 || 
          href.indexOf('admin/') === 0 ||
          href.indexOf('committee/') === 0 ||
          href.indexOf('accounting/') === 0 ||
          href.indexOf('executive/') === 0 ||
          href.indexOf('applicant/') === 0) {
        return '../../' + href;
      }
      return '../../' + href;
    }
    
    return href;
  },
  
  // Render header
  renderHeader: function() {
    var appName = (typeof I18N !== 'undefined' && typeof I18N.t === 'function') 
      ? I18N.t('appNameShort') 
      : 'บ้านพักครู';
    var indexPath = this.resolvePath('index.html');
    return `
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <a href="${indexPath}" class="text-xl font-bold text-blue-600">${appName}</a>
            </div>
            <div class="flex items-center gap-4">
              ${this.renderUserMenu()}
            </div>
          </div>
        </div>
      </header>
    `;
  },
  
  // Render user menu
  renderUserMenu: function() {
    var getLabel = function(key) {
      if (typeof I18N !== 'undefined' && typeof I18N.t === 'function') {
        return I18N.t('nav.' + key);
      }
      var labels = {
        login: 'เข้าสู่ระบบ',
        register: 'ลงทะเบียน',
        profile: 'ข้อมูลส่วนตัว',
        logout: 'ออกจากระบบ'
      };
      return labels[key] || key;
    };
    
    if (!Auth.isLoggedIn()) {
      var loginPath = this.resolvePath('login.html');
      var registerPath = this.resolvePath('register.html');
      return `
        <a href="${loginPath}" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">${getLabel('login')}</a>
        <a href="${registerPath}" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">${getLabel('register')}</a>
      `;
    }
    
    const user = Auth.getUser();
    const role = Auth.getRole();
    var profilePath = this.resolvePath('resident/profile.html');
    
    return `
      <div class="relative group">
        <button class="flex items-center gap-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="hidden sm:inline">${user ? (user.fullName || user.email) : 'User'}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 hidden group-hover:block z-50">
          <div class="px-4 py-2 text-xs text-gray-500 border-b">${role || 'User'}</div>
          <a href="${profilePath}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">${getLabel('profile')}</a>
          <a href="#" id="nav-logout" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">${getLabel('logout')}</a>
        </div>
      </div>
    `;
  },
  
  // Render navigation
  renderNav: function(currentPath) {
    const items = RoleGuard.menu();
    if (items.length === 0) return '';
    
    return `
      <nav class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex space-x-1 overflow-x-auto">
            ${items.map(item => {
              const resolvedHref = RoleGuard.resolvePath(item.href);
              const isActive = currentPath && currentPath.includes(item.href);
              return `
                <a href="${resolvedHref}" class="px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                } whitespace-nowrap">
                  ${item.label}
                </a>
              `;
            }).join('')}
          </div>
        </div>
      </nav>
    `;
  },
  
  // Render sidebar (for desktop)
  renderSidebar: function(currentPath) {
    const items = RoleGuard.menu();
    if (items.length === 0) return '';
    
    return `
      <aside class="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
        <div class="p-4">
          <nav class="space-y-1">
            ${items.map(item => {
              const resolvedHref = RoleGuard.resolvePath(item.href);
              const isActive = currentPath && currentPath.includes(item.href);
              return `
                <a href="${resolvedHref}" class="flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }">
                  <span>${item.label}</span>
                </a>
              `;
            }).join('')}
          </nav>
        </div>
      </aside>
    `;
  },
  
  // Initialize layout
  init: function(currentPath) {
    // Wait for I18N to be ready
    var initLayout = () => {
      // Render header
      const headerPlaceholder = document.getElementById('app-header');
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = this.renderHeader();
      }
      
      // Render navigation
      const navPlaceholder = document.getElementById('app-nav');
      if (navPlaceholder) {
        navPlaceholder.innerHTML = this.renderNav(currentPath);
      }
      
      // Render sidebar
      const sidebarPlaceholder = document.getElementById('app-sidebar');
      if (sidebarPlaceholder) {
        sidebarPlaceholder.innerHTML = this.renderSidebar(currentPath);
      }
      
      // Setup logout handler
      const logoutBtn = document.getElementById('nav-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          var loginPath = 'login.html';
          // Resolve login path based on current location
          if (window.location.pathname.indexOf('/resident/') >= 0 || 
              window.location.pathname.indexOf('/admin/') >= 0 ||
              window.location.pathname.indexOf('/committee/') >= 0 ||
              window.location.pathname.indexOf('/accounting/') >= 0 ||
              window.location.pathname.indexOf('/executive/') >= 0 ||
              window.location.pathname.indexOf('/applicant/') >= 0) {
            loginPath = '../../login.html';
          } else if (window.location.pathname.indexOf('/public/') >= 0) {
            loginPath = '../login.html';
          }
          API.run('logout', { sessionId: Auth.getSessionId() }, () => {
            Auth.clear();
            window.location.href = loginPath;
          });
        });
      }
    };
    
    // If I18N is ready, init immediately, otherwise wait
    if (typeof I18N !== 'undefined' && typeof I18N.init === 'function') {
      // I18N will call initLayout after initialization
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLayout);
      } else {
        initLayout();
      }
    } else {
      // Fallback: init without waiting
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLayout);
      } else {
        initLayout();
      }
    }
  }
};
