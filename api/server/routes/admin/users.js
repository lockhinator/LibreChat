const express = require('express');
const { createAdminUsersHandlers } = require('@librechat/api');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const db = require('~/models');

const router = express.Router();

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

router.patch('/:id/registration-status', requireReadUsers, async (req, res) => {
  const { status } = req.body ?? {};
  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or rejected' });
  }
  const user = await db.updateUser(req.params.id, { registrationStatus: status });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ id: req.params.id, registrationStatus: status });
});

router.get('/', requireReadUsers, handlers.listUsers);
router.get('/search', requireReadUsers, handlers.searchUsers);
// router.delete('/:id', requireManageUsers, handlers.deleteUser);

module.exports = router;
