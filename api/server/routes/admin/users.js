const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { createAdminUsersHandlers } = require('@librechat/api');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const db = require('~/models');

const router = express.Router();
const brandingDir = process.env.BRANDING_DIR || '/app/client/public/images';
const brandingFile = path.join(brandingDir, 'branding.json');
const brandingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(
      null,
      ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon'].includes(
        file.mimetype,
      ),
    ),
});

const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);
const requireReadUsers = requireCapability(SystemCapabilities.READ_USERS);
// const requireManageUsers = requireCapability(SystemCapabilities.MANAGE_USERS);

const handlers = createAdminUsersHandlers({
  findUsers: db.findUsers,
  countUsers: db.countUsers,
  deleteUserById: db.deleteUserById,
  deleteConfig: db.deleteConfig,
  deleteAclEntries: db.deleteAclEntries,
});

router.use(requireJwtAuth, requireAdminAccess);

router.get('/branding', requireReadUsers, (_req, res) => {
  try {
    return res.json(JSON.parse(fs.readFileSync(brandingFile, 'utf8')));
  } catch {
    return res.json({ title: process.env.APP_TITLE || 'LibreChat', tagline: '' });
  }
});

router.put(
  '/branding',
  requireReadUsers,
  brandingUpload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  (req, res) => {
    fs.mkdirSync(brandingDir, { recursive: true });
    let current = {};
    try {
      current = JSON.parse(fs.readFileSync(brandingFile, 'utf8'));
    } catch {
      /* first save */
    }
    const next = {
      ...current,
      title: String(req.body.title || 'LibreChat')
        .trim()
        .slice(0, 80),
      tagline: String(req.body.tagline || '')
        .trim()
        .slice(0, 240),
    };
    const extension = (file) =>
      ({
        'image/svg+xml': 'svg',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'image/x-icon': 'ico',
      })[file.mimetype] || 'png';
    for (const field of ['icon', 'favicon']) {
      const file = req.files?.[field]?.[0];
      if (!file) continue;
      const filename = `branding-${field}.${extension(file)}`;
      fs.writeFileSync(path.join(brandingDir, filename), file.buffer);
      next[`${field}Url`] = `/images/${filename}?v=${Date.now()}`;
    }
    const temporary = `${brandingFile}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, brandingFile);
    return res.json(next);
  },
);

router.get('/pending', requireReadUsers, async (req, res) => {
  const users = await db.findUsers(
    { registrationStatus: 'pending' },
    '_id name username email provider createdAt registrationStatus',
    { sort: { createdAt: 1 } },
  );
  res.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      provider: user.provider,
      createdAt: user.createdAt,
      registrationStatus: user.registrationStatus,
    })),
  });
});

router.get('/registration-history', requireReadUsers, async (req, res) => {
  const users = await db.findUsers(
    { registrationReviewedAt: { $exists: true } },
    '_id name username email provider createdAt registrationStatus registrationReviewedAt registrationReviewedBy',
    { sort: { registrationReviewedAt: -1 } },
  );
  res.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      registrationStatus: user.registrationStatus,
      registrationReviewedAt: user.registrationReviewedAt,
      registrationReviewedBy: user.registrationReviewedBy,
    })),
  });
});

router.patch('/:id/registration-status', requireReadUsers, async (req, res) => {
  const { status } = req.body ?? {};
  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or rejected' });
  }
  const user = await db.updateUser(req.params.id, {
    registrationStatus: status,
    registrationReviewedAt: new Date(),
    registrationReviewedBy: req.user?.email ?? req.user?.id ?? 'administrator',
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ id: req.params.id, registrationStatus: status });
});

router.get('/', requireReadUsers, handlers.listUsers);
router.get('/search', requireReadUsers, handlers.searchUsers);
// router.delete('/:id', requireManageUsers, handlers.deleteUser);

module.exports = router;
