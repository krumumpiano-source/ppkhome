/**
 * ui-components.js — Modern UI Component Library
 * Reusable components for the application
 */

const UI = {
  // Show toast notification
  toast: function(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }[type] || 'bg-gray-500';
    
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  // Show loading spinner
  showLoading: function(container) {
    const loader = document.createElement('div');
    loader.className = 'flex items-center justify-center p-8';
    loader.innerHTML = `
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span class="ml-3 text-gray-600">${I18N.t('loading')}</span>
    `;
    if (container) {
      container.innerHTML = '';
      container.appendChild(loader);
    }
    return loader;
  },
  
  // Show empty state
  showEmpty: function(container, message) {
    const empty = document.createElement('div');
    empty.className = 'text-center py-12';
    empty.innerHTML = `
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="mt-4 text-gray-500">${message || I18N.t('messages.noData')}</p>
    `;
    if (container) {
      container.innerHTML = '';
      container.appendChild(empty);
    }
    return empty;
  },
  
  // Create card component
  createCard: function(title, content, actions) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6 mb-6';
    
    let html = '';
    if (title) {
      html += `<h2 class="text-xl font-semibold text-gray-800 mb-4">${title}</h2>`;
    }
    html += `<div class="text-gray-600">${content}</div>`;
    if (actions) {
      html += `<div class="mt-4 flex gap-2">${actions}</div>`;
    }
    
    card.innerHTML = html;
    return card;
  },
  
  // Create button
  createButton: function(text, onClick, variant = 'primary', size = 'md') {
    const button = document.createElement('button');
    const variants = {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
      success: 'bg-green-500 hover:bg-green-600 text-white'
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    };
    
    button.className = `${variants[variant] || variants.primary} ${sizes[size] || sizes.md} rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`;
    button.textContent = text;
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    return button;
  },
  
  // Create form input
  createInput: function(label, type = 'text', name, value = '', required = false, placeholder = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-4';
    
    let html = '';
    if (label) {
      html += `<label class="block text-sm font-medium text-gray-700 mb-1">${label}${required ? ' <span class="text-red-500">*</span>' : ''}</label>`;
    }
    
    if (type === 'textarea') {
      html += `<textarea name="${name}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${required ? 'required' : ''} placeholder="${placeholder}">${value}</textarea>`;
    } else {
      html += `<input type="${type}" name="${name}" value="${value}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${required ? 'required' : ''} placeholder="${placeholder}">`;
    }
    
    wrapper.innerHTML = html;
    return wrapper;
  },
  
  // Create table
  createTable: function(headers, rows, actions) {
    const table = document.createElement('div');
    table.className = 'overflow-x-auto bg-white rounded-lg shadow-md';
    
    let html = '<table class="min-w-full divide-y divide-gray-200">';
    
    // Header
    if (headers && headers.length > 0) {
      html += '<thead class="bg-gray-50"><tr>';
      headers.forEach(h => {
        html += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${h}</th>`;
      });
      if (actions) {
        html += '<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>';
      }
      html += '</tr></thead>';
    }
    
    // Body
    html += '<tbody class="bg-white divide-y divide-gray-200">';
    if (rows && rows.length > 0) {
      rows.forEach(row => {
        html += '<tr class="hover:bg-gray-50">';
        row.forEach(cell => {
          html += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cell}</td>`;
        });
        if (actions) {
          html += `<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actions(row)}</td>`;
        }
        html += '</tr>';
      });
    } else {
      html += `<tr><td colspan="${headers.length + (actions ? 1 : 0)}" class="px-6 py-8 text-center text-gray-500">${I18N.t('messages.noData')}</td></tr>`;
    }
    html += '</tbody></table>';
    
    table.innerHTML = html;
    return table;
  },
  
  // Show modal
  showModal: function(title, content, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">${title}</h3>
        <div class="text-gray-600 mb-6">${content}</div>
        <div class="flex justify-end gap-2">
          ${onCancel ? `<button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" id="modal-cancel">${I18N.t('cancel')}</button>` : ''}
          ${onConfirm ? `<button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" id="modal-confirm">${I18N.t('confirm')}</button>` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    if (onConfirm) {
      modal.querySelector('#modal-confirm').addEventListener('click', () => {
        onConfirm();
        modal.remove();
      });
    }
    
    if (onCancel) {
      modal.querySelector('#modal-cancel').addEventListener('click', () => {
        if (onCancel) onCancel();
        modal.remove();
      });
    }
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (onCancel) onCancel();
        modal.remove();
      }
    });
    
    return modal;
  }
};
