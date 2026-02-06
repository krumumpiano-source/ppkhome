const db = require('./db');

const MENU_REGISTRY = [
  {
    id: 'MENU_BILLING',
    labelKey: 'nav.billing',
    href: 'resident/billing.html',
    order: 10,
    paths: [
      'resident/dashboard.html',
      'resident/billing.html',
      'resident/history.html'
    ]
  },
  {
    id: 'MENU_WATER_ENTRY',
    labelKey: 'nav.waterEntry',
    href: 'committee/water-meter.html',
    order: 20,
    paths: [
      'committee/water-meter.html',
      'committee/task-status.html'
    ]
  },
  {
    id: 'MENU_ELECTRIC_ENTRY',
    labelKey: 'nav.electricEntry',
    href: 'committee/electric-bill.html',
    order: 30,
    paths: [
      'committee/electric-bill.html'
    ]
  },
  {
    id: 'MENU_MONTHLY_DISBURSEMENT',
    labelKey: 'nav.monthlyDisbursement',
    href: 'accounting/summary.html',
    order: 40,
    paths: [
      'accounting/summary.html'
    ]
  },
  {
    id: 'MENU_LEDGER',
    labelKey: 'nav.ledger',
    href: 'accounting/ledger.html',
    order: 50,
    paths: [
      'accounting/ledger.html'
    ]
  },
  {
    id: 'MENU_SLIP_REVIEW',
    labelKey: 'nav.slipReview',
    href: 'accounting/bank-check.html',
    order: 60,
    paths: [
      'accounting/bank-check.html'
    ]
  },
  {
    id: 'MENU_PROFILE_SETTINGS',
    labelKey: 'nav.profileSettings',
    href: 'resident/profile.html',
    order: 70,
    paths: [
      'resident/profile.html'
    ]
  },
  {
    id: 'MENU_ADMIN_SETTINGS',
    labelKey: 'nav.adminSettings',
    href: 'admin/permissions.html',
    order: 80,
    paths: [
      'admin/permissions.html',
      'admin/users.html',
      'admin/roles.html',
      'admin/assets.html',
      'admin/queue.html',
      'admin/settings.html',
      'admin/about-manager.html',
      'admin/audit-log.html'
    ]
  },
  {
    id: 'MENU_RULES_FORMS',
    labelKey: 'nav.rulesForms',
    href: 'rules.html',
    order: 90,
    paths: [
      'rules.html',
      'applicant/apply.html',
      'applicant/queue-status.html'
    ]
  },
  {
    id: 'MENU_MANUAL',
    labelKey: 'nav.manual',
    href: 'manual.html',
    order: 100,
    paths: [
      'manual.html'
    ]
  },
  {
    id: 'MENU_REPORTS',
    labelKey: 'nav.reports',
    href: 'executive/dashboard.html',
    order: 110,
    paths: [
      'admin/reports.html',
      'executive/dashboard.html',
      'executive/reports.html'
    ]
  }
];

const MENU_IDS = MENU_REGISTRY.map(menu => menu.id);

const ROLE_PRESET_MAP = {
  admin: 'ADMIN',
  deputy_admin: 'ADMIN',
  committee: 'COMMITTEE',
  accounting: 'ACCOUNTING',
  resident: 'RESIDENT',
  executive: 'EXECUTIVE',
  applicant: 'EXTERNAL',
  water_staff: 'WATER_STAFF',
  electric_staff: 'ELECTRIC_STAFF',
  external: 'EXTERNAL'
};

const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: [...MENU_IDS],
  WATER_STAFF: [
    'MENU_WATER_ENTRY',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  ELECTRIC_STAFF: [
    'MENU_ELECTRIC_ENTRY',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  ACCOUNTING: [
    'MENU_MONTHLY_DISBURSEMENT',
    'MENU_LEDGER',
    'MENU_SLIP_REVIEW',
    'MENU_REPORTS',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  RESIDENT: [
    'MENU_BILLING',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  EXTERNAL: [
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  COMMITTEE: [
    'MENU_BILLING',
    'MENU_WATER_ENTRY',
    'MENU_ELECTRIC_ENTRY',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  EXECUTIVE: [
    'MENU_REPORTS',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ]
};

function normalizeRole(role) {
  if (!role) return 'EXTERNAL';
  return ROLE_PRESET_MAP[String(role).toLowerCase()] || 'EXTERNAL';
}

function buildPermissionMap(allowedIds) {
  const map = {};
  MENU_REGISTRY.forEach(menu => {
    map[menu.id] = allowedIds.indexOf(menu.id) >= 0;
  });
  return map;
}

function getDefaultPermissions(roleKey) {
  const allowed = DEFAULT_ROLE_PERMISSIONS[roleKey] || [];
  return buildPermissionMap(allowed);
}

function parseAllow(value) {
  if (value === true || value === false) return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
  }
  return false;
}

async function getUserMenuOverrides(userId) {
  if (!userId) return {};
  const rows = await db.getCollection('USER_MENU_PERMISSIONS');
  const overrides = {};
  rows.forEach(row => {
    if (row.userId !== userId) return;
    if (!row.menuId) return;
    overrides[row.menuId] = parseAllow(row.allow);
  });
  return overrides;
}

async function upsertUserOverride(userId, menuId, allow, updatedBy) {
  const collection = await db.getCollection('USER_MENU_PERMISSIONS');
  const existing = db.findInCollection(
    collection,
    row => row.userId === userId && row.menuId === menuId
  );
  const payload = {
    userId,
    menuId,
    allow: allow ? 'TRUE' : 'FALSE',
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || ''
  };
  if (existing) {
    await db.updateInCollection(
      'USER_MENU_PERMISSIONS',
      row => row.userId === userId && row.menuId === menuId,
      () => Object.assign(existing, payload)
    );
    return { action: 'updated' };
  }
  await db.addToCollection('USER_MENU_PERMISSIONS', payload);
  return { action: 'added' };
}

async function removeUserOverride(userId, menuId) {
  const removed = await db.deleteFromCollection(
    'USER_MENU_PERMISSIONS',
    row => row.userId === userId && row.menuId === menuId
  );
  return removed ? { action: 'removed' } : null;
}

async function clearUserOverrides(userId) {
  const rows = await db.getCollection('USER_MENU_PERMISSIONS');
  const targets = rows.filter(row => row.userId === userId);
  const removed = [];
  for (const row of targets) {
    const result = await db.deleteFromCollection(
      'USER_MENU_PERMISSIONS',
      r => r.userId === userId && r.menuId === row.menuId
    );
    if (result) removed.push(row.menuId);
  }
  return removed;
}

async function getEffectiveMenuPermissions(userId, role) {
  const roleKey = normalizeRole(role);
  const defaultPermissions = getDefaultPermissions(roleKey);
  const overrides = await getUserMenuOverrides(userId);
  const effective = Object.assign({}, defaultPermissions);
  Object.keys(overrides).forEach(menuId => {
    if (!Object.prototype.hasOwnProperty.call(defaultPermissions, menuId)) return;
    effective[menuId] = overrides[menuId];
  });
  const allowedMenuIds = MENU_REGISTRY
    .filter(menu => effective[menu.id])
    .map(menu => menu.id);
  return {
    roleKey,
    defaultPermissions,
    overrides,
    effectivePermissions: effective,
    allowedMenuIds
  };
}

async function setUserMenuPermissions(userId, role, desiredPermissions, updatedBy) {
  const roleKey = normalizeRole(role);
  const defaultPermissions = getDefaultPermissions(roleKey);
  const overrides = await getUserMenuOverrides(userId);
  const changes = [];

  for (const menu of MENU_REGISTRY) {
    const desired = parseAllow(desiredPermissions ? desiredPermissions[menu.id] : false);
    const defaultAllowed = !!defaultPermissions[menu.id];
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, menu.id);
    const currentEffective = hasOverride ? overrides[menu.id] : defaultAllowed;

    if (desired === defaultAllowed) {
      if (hasOverride) {
        await removeUserOverride(userId, menu.id);
        changes.push({
          menuId: menu.id,
          from: currentEffective,
          to: desired,
          action: 'reset'
        });
      }
      continue;
    }

    if (!hasOverride || overrides[menu.id] !== desired) {
      await upsertUserOverride(userId, menu.id, desired, updatedBy);
      changes.push({
        menuId: menu.id,
        from: currentEffective,
        to: desired,
        action: hasOverride ? 'update' : 'add'
      });
    }
  }

  return { roleKey, changes };
}

module.exports = {
  MENU_REGISTRY,
  MENU_IDS,
  normalizeRole,
  getDefaultPermissions,
  getUserMenuOverrides,
  getEffectiveMenuPermissions,
  setUserMenuPermissions,
  clearUserOverrides
};
