// Generic caching middleware for GET endpoints
export function cache(ttlSeconds, buildKey) {
  return async function (req, res, next) {
    try {
      const redis = req.redis;
      if (!redis) return next();

      // Only cache safe GETs
      if (req.method !== "GET") return next();

      const key = typeof buildKey === "function" ? buildKey(req) : buildKey;
      if (!key) return next();

      const cached = await redis.get(key);
      if (cached) {
        res.set("X-Cache", "HIT");
        // send JSON already stringified to keep fast path
        res.set("Content-Type", "application/json");
        return res.send(cached);
      }

      // Capture res.json to write to cache on the way out
      const origJson = res.json.bind(res);
      res.json = async (payload) => {
        try {
          const body = JSON.stringify(payload);
          await redis.setEx(key, ttlSeconds, body);
          res.set("X-Cache", "MISS");
          res.set("Content-Type", "application/json");
          return res.send(body);
        } catch (e) {
          // If cache write fails, still return response
          res.set("X-Cache", "BYPASS");
          return origJson(payload);
        }
      };

      next();
    } catch (err) {
      // If anything fails, skip cache gracefully
      next();
    }
  };
}
