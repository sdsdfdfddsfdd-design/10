import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GameManager } from './server/gameEngine.js';
import { getFirestoreStatus, getAllFirebaseUsers, upsertFirebaseUserProfile, setFirebaseUserBalance } from './server/firebase.js';

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

const gameManager = GameManager.getInstance();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Firebase status
app.get('/api/firebase/status', (req, res) => {
  res.json(getFirestoreStatus());
});

// Balance check & recharge
app.get('/api/user/:id/balance', async (req, res) => {
  const userId = req.params.id;
  if (!userId || !userId.trim() || userId === 'undefined' || userId === 'null' || userId.startsWith('usr_')) {
    res.json({ balance: 0 });
    return;
  }
  const cleanId = userId.trim();
  try {
    const balance = await gameManager.loadUserBalanceFromFirebase(cleanId);
    res.json({ balance });
  } catch (err) {
    const balance = gameManager.getOrCreateUserBalance(cleanId);
    res.json({ balance });
  }
});

// Live Game Odds & Win Rates endpoint for games
app.get('/api/game/odds', (req, res) => {
  res.json({
    globalWinRate: gameManager.adminConfig.globalWinRate ?? 40,
    gameWinRates: gameManager.adminConfig.gameWinRates ?? {
      global: 40,
      teenPatti: 40,
      rocketCrash: 42,
      mines: 45,
      horseRacing: 38,
      happyCake: 40,
      luckySeven: 44,
      dragonTiger: 45,
    },
    houseMode: gameManager.adminConfig.houseMode ?? 'casino_standard',
  });
});

app.post('/api/user/:id/recharge', (req, res) => {
  const userId = req.params.id;
  if (!userId || !userId.trim() || userId === 'undefined' || userId === 'null') {
    res.status(400).json({ error: 'Valid user ID is required' });
    return;
  }
  const cleanId = userId.trim();
  const { amount, userName } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'Invalid recharge amount' });
    return;
  }
  const newBalance = gameManager.rechargeBalance(cleanId, userName || 'Player', numAmount);
  res.json({ success: true, balance: newBalance });
});

// Helper IP endpoint
app.get('/api/ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  res.json({ ip: Array.isArray(ip) ? ip[0] : String(ip).split(',')[0].trim() });
});

// Game history endpoint
app.get(['/api/game/history', '/api/game/history/'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ history: gameManager.history || [] });
});

// Transaction records endpoint
app.get('/api/game/transactions', (req, res) => {
  res.json({ transactions: gameManager.transactions });
});

// Admin endpoints
app.get('/api/admin/overview', (req, res) => {
  const activeTables = Array.from(gameManager.tables.values()).map(t => ({
    id: t.id,
    name: t.name,
    phase: t.phase,
    roundNumber: t.roundNumber,
    totalPot: t.totalPot,
    playersCount: t.players.filter(p => p !== null).length,
    humanCount: t.players.filter(p => p !== null && !p.isBot).length,
    timerRemaining: t.timerRemaining,
    players: t.players.filter(p => p !== null),
  }));

  res.json({
    config: gameManager.adminConfig,
    activeTables,
    connectedSockets: gameManager.connections.size,
    totalTransactions: gameManager.transactions.length,
    recentTransactions: gameManager.transactions.slice(0, 50),
    historyCount: gameManager.history.length,
  });
});

app.post('/api/admin/config', (req, res) => {
  const { config } = req.body;
  if (!config) {
    res.status(400).json({ error: 'Missing configuration' });
    return;
  }
  gameManager.updateAdminConfig(config);
  res.json({ success: true, config: gameManager.adminConfig });
});

app.post('/api/admin/kick', (req, res) => {
  const { tableId, playerId } = req.body;
  if (!tableId || !playerId) {
    res.status(400).json({ error: 'Missing tableId or playerId' });
    return;
  }
  gameManager.leaveTable(tableId, playerId);
  res.json({ success: true });
});

// Admin Users List
app.get('/api/admin/users', async (req, res) => {
  try {
    const cloudUsers = await getAllFirebaseUsers();
    // Also include in-memory users if not in Firestore
    const localUserMap = new Map<string, any>();
    for (const u of cloudUsers) {
      localUserMap.set(u.userId || u.id, u);
    }

    for (const [userId, balance] of gameManager.userBalances.entries()) {
      if (!localUserMap.has(userId)) {
        localUserMap.set(userId, {
          userId,
          id: userId,
          customId: `ROYAL-${userId.slice(-6).toUpperCase()}`,
          displayName: `Player_${userId.slice(-4)}`,
          email: `${userId}@player.local`,
          role: 'admin',
          balance,
        });
      } else {
        // Sync latest in-memory balance if available
        const existing = localUserMap.get(userId);
        if (existing) {
          existing.balance = balance;
        }
      }
    }

    res.json({ users: Array.from(localUserMap.values()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: String(err) });
  }
});

// Admin Recharge specific user in Firestore
app.post('/api/admin/recharge-user', async (req, res) => {
  const { userId, amount, adminName } = req.body;
  const numAmount = Number(amount);
  if (!userId || !numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'Valid userId and positive amount are required' });
    return;
  }

  const newBalance = gameManager.rechargeBalance(userId, adminName || 'Admin', numAmount);
  // Also push to Firestore
  try {
    await setFirebaseUserBalance(userId, newBalance);
  } catch {
    // handled gracefully
  }

  res.json({ success: true, userId, newBalance });
});

// Admin change user role (promote to admin or demote to player)
app.post('/api/admin/toggle-user-role', async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || (role !== 'admin' && role !== 'player')) {
    res.status(400).json({ error: 'Valid userId and role are required' });
    return;
  }
  try {
    await upsertFirebaseUserProfile(userId, { userId, role });
    res.json({ success: true, userId, role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role', details: String(err) });
  }
});

// Admin Reset User Balance to 0
app.post('/api/admin/reset-user-balance', async (req, res) => {
  const { userId, userName } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'Valid userId is required' });
    return;
  }
  try {
    const newBalance = await gameManager.resetUserBalance(userId, userName);
    res.json({ success: true, userId, newBalance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset balance', details: String(err) });
  }
});

// Admin Delete User Account Permanently
app.post('/api/admin/delete-user', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'Valid userId is required' });
    return;
  }
  try {
    const deleted = await gameManager.deleteUser(userId);
    res.json({ success: true, userId, cloudDeleted: deleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user account', details: String(err) });
  }
});

// Admin Cleanup Server (Clear logs, reset table, flush cache)
app.post('/api/admin/cleanup-server', (req, res) => {
  try {
    const stats = gameManager.cleanupServer();
    res.json({ success: true, ...stats, message: 'Server cleaned up and tables refreshed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cleanup server', details: String(err) });
  }
});

// Sync User Profile (e.g. from registration or login)
app.post('/api/user/sync-profile', async (req, res) => {
  const { userId, email, displayName, customId, role, balance } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  // If email is the owner's email sdsdfdfddsfdd@gmail.com or contains admin, give admin role
  const isOwnerAdmin = email?.toLowerCase() === 'sdsdfdfddsfdd@gmail.com' || email?.toLowerCase().includes('admin');
  const assignedRole = role || (isOwnerAdmin ? 'admin' : 'player');
  const userCustomId = customId || `ROYAL-${Math.floor(100000 + Math.random() * 900000)}`;

  // Update in gameManager memory if provided
  if (typeof balance === 'number') {
    gameManager.userBalances.set(userId, balance);
  } else if (!gameManager.userBalances.has(userId)) {
    gameManager.userBalances.set(userId, 0);
  }

  try {
    await upsertFirebaseUserProfile(userId, {
      userId,
      email: email || '',
      displayName: displayName || (email ? email.split('@')[0] : `Player_${userId.slice(-4)}`),
      customId: userCustomId,
      role: assignedRole,
      balance: gameManager.getOrCreateUserBalance(userId),
    });
  } catch {
    // ignore
  }

  res.json({
    success: true,
    user: {
      userId,
      email,
      displayName: displayName || (email ? email.split('@')[0] : `Player_${userId.slice(-4)}`),
      customId: userCustomId,
      role: assignedRole,
      balance: gameManager.getOrCreateUserBalance(userId),
    }
  });
});

// Admin endpoint: Zero out all balances (removes fake/virtual initial coins)
app.post('/api/admin/zero-all-balances', async (req, res) => {
  let count = 0;
  for (const userId of gameManager.userBalances.keys()) {
    gameManager.userBalances.set(userId, 0);
    try {
      await setFirebaseUserBalance(userId, 0);
    } catch {
      // offline fallback
    }
    count++;
  }

  // Also zero out cloud users from Firestore
  try {
    const allUsers = await getAllFirebaseUsers();
    for (const u of allUsers) {
      const uid = u.userId || u.id;
      if (uid) {
        gameManager.userBalances.set(uid, 0);
        await setFirebaseUserBalance(uid, 0);
        count++;
      }
    }
  } catch {
    // fallback
  }

  res.json({ success: true, message: 'All user balances zeroed to 0', count });
});

// Sync balance endpoint for games (Happy Cake, Teen Patti, etc.)
app.post('/api/user/sync-balance', async (req, res) => {
  const { userId, delta, currentBalance } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  let newBalance: number;
  if (typeof delta === 'number') {
    const existing = gameManager.getOrCreateUserBalance(userId);
    newBalance = Math.max(0, existing + delta);
    gameManager.userBalances.set(userId, newBalance);
  } else if (typeof currentBalance === 'number') {
    newBalance = Math.max(0, currentBalance);
    gameManager.userBalances.set(userId, newBalance);
  } else {
    res.status(400).json({ error: 'Provide delta or currentBalance' });
    return;
  }

  try {
    await setFirebaseUserBalance(userId, newBalance);
  } catch {
    // offline fallback
  }

  res.json({ success: true, balance: newBalance });
});

// API catch-all to prevent unmatched API requests from falling through to HTML index
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl || req.url} not found` });
});

// WebSocket real-time handling
wss.on('connection', (ws: WebSocket) => {
  const connectionId = 'conn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  let currentUserId = '';
  let currentTableId = 'table-main';

  const client = {
    id: connectionId,
    userId: currentUserId,
    tableId: currentTableId,
    send: (data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    },
  };

  gameManager.registerClient(client);

  ws.on('message', (raw: string) => {
    try {
      const message = JSON.parse(raw.toString());
      switch (message.type) {
        case 'JOIN_TABLE': {
          const { tableId = 'table-main', player } = message;
          const playerId = (player?.id && String(player.id).trim()) || ('guest_' + Math.random().toString(36).substring(2, 7));
          const playerName = (player?.name && String(player.name).trim()) || 'Player';
          currentTableId = tableId;
          currentUserId = playerId;
          client.tableId = tableId;
          client.userId = playerId;

          const table = gameManager.joinTable(tableId, { id: playerId, name: playerName });
          ws.send(JSON.stringify({
            type: 'JOINED_SUCCESS',
            tableId: table.id,
            balance: gameManager.getOrCreateUserBalance(playerId),
          }));
          gameManager.broadcastTable(tableId);
          break;
        }

        case 'PLACE_SPOT_BET':
        case 'PLACE_BET': {
          const { tableId = currentTableId, playerId, spot = 'B', amount } = message;
          const result = gameManager.placeSpotBet(tableId, playerId, spot, amount);
          ws.send(JSON.stringify({
            type: 'BET_RESULT',
            ...result,
            spot,
            balance: gameManager.getOrCreateUserBalance(playerId),
          }));
          break;
        }

        case 'TOGGLE_AUTOPLAY': {
          const { tableId = currentTableId, playerId } = message;
          const isAuto = gameManager.toggleAutoPlay(tableId, playerId);
          ws.send(JSON.stringify({
            type: 'AUTOPLAY_UPDATED',
            isAutoPlay: isAuto,
          }));
          break;
        }

        case 'RECHARGE': {
          const { playerId, amount, userName } = message;
          const newBal = gameManager.rechargeBalance(playerId, userName, amount);
          ws.send(JSON.stringify({
            type: 'BALANCE_UPDATED',
            balance: newBal,
          }));
          gameManager.broadcastTable(currentTableId);
          break;
        }

        case 'LEAVE_TABLE': {
          const { tableId = currentTableId, playerId } = message;
          gameManager.leaveTable(tableId, playerId);
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    gameManager.unregisterClient(connectionId);
    if (currentTableId && currentUserId) {
      // Optional: leave table if desired, or keep seat briefly
    }
  });
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Card Game Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
