// Optional Socket.io Redis adapter. With more than one server instance, room
// broadcasts (e.g. `board:<id>`) must go through a shared pub/sub bus, otherwise
// a client connected to instance A never receives events emitted on instance B.
// No-ops (returns false) when REDIS_URL isn't configured.
export async function attachRedisAdapter(io, url) {
  if (!url) return false;

  const [{ createAdapter }, { createClient }] = await Promise.all([
    import('@socket.io/redis-adapter'),
    import('redis'),
  ]);

  const pubClient = createClient({ url });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));
  return true;
}
