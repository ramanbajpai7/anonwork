// ============================================
// CONTENT SERVICE - Posts, Comments, Votes, Companies,
// Reviews, Salaries, Topics, Bookmarks, Search
// ============================================
// Uses Redis caching for high-traffic read endpoints
// Publishes events to RabbitMQ for notifications
// ============================================

const express = require('express');
const { createPool, query } = require('../../shared/database');
const { getCache, setCache, invalidateCachePattern } = require('../../shared/redis');
const { publish, connect: connectRabbitMQ, EXCHANGES, ROUTING_KEYS } = require('../../shared/rabbitmq');

const app = express();
const PORT = process.env.CONTENT_SERVICE_PORT || 4002;
app.use(express.json());

const DATABASE_URL = process.env.DATABASE_URL;
let db;
async function initDB() { db = createPool(DATABASE_URL); }

function getUserId(req) { return req.headers['x-user-id']; }

// ============ POSTS ============

app.get('/api/posts', async (req, res) => {
  try {
    const { feed_type = 'recent', topic_id, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const cacheKey = `posts:${feed_type}:${topic_id || 'all'}:${page}`;

    // 🔴 Redis Cache: Check cache first
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    let orderBy = feed_type === 'popular' ? 'p.score DESC' : 'p.created_at DESC';
    let where = "p.status = 'active'";
    const params = [parseInt(limit), offset];
    if (topic_id) { where += ' AND p.topic_id = $3'; params.push(topic_id); }

    const posts = await query(db,
      `SELECT p.*, u.anon_username as author_anon_username, u.is_verified_employee as author_is_verified,
              u.profile_photo_url as author_profile_photo, u.display_name as author_display_name,
              t.name as topic_name, t.slug as topic_slug, t.icon as topic_icon,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active') as comment_count,
              (SELECT COALESCE(SUM(vote), 0) FROM post_votes WHERE post_id = p.id) as vote_sum
       FROM posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN topics t ON p.topic_id = t.id
       WHERE ${where} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`, params);

    const result = { posts, page: parseInt(page), limit: parseInt(limit) };

    // 🔴 Redis Cache: Store result for 60 seconds
    await setCache(cacheKey, result, 60);
    return res.json(result);
  } catch (error) {
    console.error('[Content] Posts error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const posts = await query(db,
      `SELECT p.*, u.anon_username as author_anon_username, u.is_verified_employee as author_is_verified,
              u.profile_photo_url as author_profile_photo, u.display_name as author_display_name,
              t.name as topic_name, t.slug as topic_slug, t.icon as topic_icon,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active') as comment_count
       FROM posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN topics t ON p.topic_id = t.id
       WHERE p.id = $1`, [req.params.id]);
    if (!posts.length) return res.status(404).json({ message: 'Post not found' });
    await query(db, 'UPDATE posts SET views = views + 1 WHERE id = $1', [req.params.id]);
    return res.json({ post: posts[0] });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.post('/api/posts', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { title, body, channel_id, topic_id, is_anonymous } = req.body;
    if (!body) return res.status(400).json({ message: 'Post body required' });

    const posts = await query(db,
      `INSERT INTO posts (author_id, title, body, channel_id, topic_id, is_anonymous, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, '{}') RETURNING *`,
      [userId, title || null, body, channel_id || null, topic_id || null, is_anonymous !== false]);

    // 🐇 RabbitMQ: Publish post.created event
    await publish(EXCHANGES.NOTIFICATIONS, ROUTING_KEYS.POST_CREATED, {
      postId: posts[0].id, authorId: userId,
      title: title || body.slice(0, 50), body: body.slice(0, 200),
    });

    // 🔴 Invalidate posts cache
    await invalidateCachePattern('posts:*');
    return res.status(201).json({ post: posts[0] });
  } catch (error) {
    console.error('[Content] Create post error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ============ COMMENTS ============

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const comments = await query(db,
      `SELECT c.*, u.anon_username as author_anon_username, u.is_verified_employee as author_is_verified,
              u.profile_photo_url as author_profile_photo, u.display_name as author_display_name
       FROM comments c LEFT JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1 AND c.status = 'active' ORDER BY c.created_at ASC LIMIT $2 OFFSET $3`,
      [req.params.id, parseInt(limit), offset]);
    return res.json({ comments, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { body, parent_comment_id } = req.body;
    if (!body) return res.status(400).json({ message: 'Comment body required' });

    const comments = await query(db,
      `INSERT INTO comments (post_id, author_id, body, parent_comment_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, userId, body, parent_comment_id || null]);

    // 🐇 Publish comment.created event
    await publish(EXCHANGES.NOTIFICATIONS, ROUTING_KEYS.COMMENT_CREATED, {
      commentId: comments[0].id, postId: req.params.id,
      authorId: userId, body: body.slice(0, 200), parentCommentId: parent_comment_id,
    });

    return res.status(201).json({ comment: comments[0] });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ VOTES ============

app.post('/api/posts/:id/vote', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { vote } = req.body;
    if (![1, -1, 0].includes(vote)) return res.status(400).json({ message: 'Invalid vote' });

    const existing = await query(db, 'SELECT * FROM post_votes WHERE post_id = $1 AND user_id = $2', [req.params.id, userId]);
    if (existing.length > 0) {
      if (vote === 0) await query(db, 'DELETE FROM post_votes WHERE id = $1', [existing[0].id]);
      else await query(db, 'UPDATE post_votes SET vote = $1 WHERE id = $2', [vote, existing[0].id]);
    } else if (vote !== 0) {
      await query(db, 'INSERT INTO post_votes (post_id, user_id, vote) VALUES ($1, $2, $3)', [req.params.id, userId, vote]);
    }

    const result = await query(db, 'SELECT COALESCE(SUM(vote), 0) as score FROM post_votes WHERE post_id = $1', [req.params.id]);
    const score = parseInt(result[0]?.score || '0');
    await query(db, 'UPDATE posts SET score = $1 WHERE id = $2', [score, req.params.id]);

    if (vote === 1) {
      await publish(EXCHANGES.NOTIFICATIONS, ROUTING_KEYS.VOTE_CREATED, {
        postId: req.params.id, voterId: userId, score,
      });
    }
    await invalidateCachePattern('posts:*');
    return res.json({ score });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ COMPANIES ============

app.get('/api/companies', async (req, res) => {
  try {
    const { search = '', page = '1', limit = '20' } = req.query;
    const cacheKey = `companies:${search}:${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    let where = 'WHERE verified = true';
    const params = [];
    let idx = 1;
    if (search) { where += ` AND LOWER(name) LIKE LOWER($${idx})`; params.push(`%${search}%`); idx++; }
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const companies = await query(db, `SELECT * FROM companies ${where} ORDER BY name LIMIT $${idx} OFFSET $${idx + 1}`, params);
    const result = { companies, page: parseInt(page), limit: parseInt(limit) };
    await setCache(cacheKey, result, 300);
    return res.json(result);
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const companies = await query(db, 'SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (!companies.length) return res.status(404).json({ message: 'Company not found' });
    return res.json({ company: companies[0] });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ REVIEWS ============

app.get('/api/reviews', async (req, res) => {
  try {
    const { company, page = '1', limit = '20' } = req.query;
    let where = 'WHERE 1=1'; const params = []; let idx = 1;
    if (company) { where += ` AND LOWER(company_name) LIKE LOWER($${idx})`; params.push(`%${company}%`); idx++; }
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const reviews = await query(db,
      `SELECT r.*, u.anon_username FROM company_reviews r LEFT JOIN users u ON r.user_id = u.id
       ${where} ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, params);
    return res.json({ reviews, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { company_name, job_title, employment_status, overall_rating, culture_rating, leadership_rating, compensation_rating, worklife_rating, growth_rating, pros, cons } = req.body;
    if (!company_name || !overall_rating) return res.status(400).json({ message: 'Company name and rating required' });
    const reviews = await query(db,
      `INSERT INTO company_reviews (user_id, company_name, job_title, employment_status, overall_rating, culture_rating, leadership_rating, compensation_rating, worklife_rating, growth_rating, pros, cons)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [userId, company_name, job_title, employment_status || 'current', overall_rating, culture_rating, leadership_rating, compensation_rating, worklife_rating, growth_rating, pros, cons]);
    await publish(EXCHANGES.EVENTS, ROUTING_KEYS.REVIEW_SUBMITTED, { reviewId: reviews[0].id, company_name, userId });
    return res.status(201).json({ review: reviews[0] });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ SALARIES ============

app.get('/api/salaries', async (req, res) => {
  try {
    const { company, title, location } = req.query;
    const cacheKey = `salaries:${company || ''}:${title || ''}:${location || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    let where = 'WHERE 1=1'; const params = []; let idx = 1;
    if (company) { where += ` AND LOWER(company_name) LIKE LOWER($${idx})`; params.push(`%${company}%`); idx++; }
    if (title) { where += ` AND LOWER(job_title) LIKE LOWER($${idx})`; params.push(`%${title}%`); idx++; }
    if (location) { where += ` AND LOWER(location) LIKE LOWER($${idx})`; params.push(`%${location}%`); idx++; }
    const salaries = await query(db,
      `SELECT company_name, job_title, level, location, COUNT(*) as entry_count,
              ROUND(AVG(base_salary)) as avg_base,
              ROUND(AVG(base_salary + COALESCE(bonus,0) + COALESCE(stock_annual,0))) as avg_total
       FROM salary_entries ${where} GROUP BY company_name, job_title, level, location ORDER BY avg_base DESC LIMIT 50`, params);
    const result = { salaries };
    await setCache(cacheKey, result, 600);
    return res.json(result);
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.post('/api/salaries', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { company_name, job_title, level, years_experience, location, base_salary, bonus, stock_annual, currency } = req.body;
    if (!company_name || !job_title || !base_salary) return res.status(400).json({ message: 'Company, title, salary required' });
    const entries = await query(db,
      `INSERT INTO salary_entries (user_id, company_name, job_title, level, years_experience, location, base_salary, bonus, stock_annual, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [userId, company_name, job_title, level, years_experience, location, base_salary, bonus || 0, stock_annual || 0, currency || 'USD']);
    await invalidateCachePattern('salaries:*');
    return res.status(201).json({ entry: entries[0] });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ TOPICS ============

app.get('/api/topics', async (req, res) => {
  try {
    const cached = await getCache('topics:all');
    if (cached) return res.json(cached);
    const topics = await query(db, 'SELECT * FROM topics WHERE is_active = true ORDER BY post_count DESC');
    const result = { topics };
    await setCache('topics:all', result, 300);
    return res.json(result);
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.get('/api/topics/:slug', async (req, res) => {
  try {
    const topics = await query(db, 'SELECT * FROM topics WHERE slug = $1', [req.params.slug]);
    if (!topics.length) return res.status(404).json({ message: 'Topic not found' });
    return res.json({ topic: topics[0] });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ BOOKMARKS ============

app.get('/api/bookmarks', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const bookmarks = await query(db,
      `SELECT b.id as bookmark_id, b.created_at as bookmarked_at, p.*, u.anon_username as author_anon_username
       FROM bookmarks b JOIN posts p ON b.post_id = p.id LEFT JOIN users u ON p.author_id = u.id
       WHERE b.user_id = $1 AND p.status = 'active' ORDER BY b.created_at DESC`, [userId]);
    return res.json({ bookmarks });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.post('/api/bookmarks', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { post_id } = req.body;
    const existing = await query(db, 'SELECT id FROM bookmarks WHERE user_id = $1 AND post_id = $2', [userId, post_id]);
    if (existing.length) return res.status(400).json({ message: 'Already bookmarked' });
    const bookmarks = await query(db, 'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) RETURNING *', [userId, post_id]);
    return res.status(201).json({ bookmark: bookmarks[0] });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

app.delete('/api/bookmarks', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { post_id } = req.body;
    await query(db, 'DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2', [userId, post_id]);
    return res.json({ message: 'Bookmark removed' });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// ============ SEARCH ============

app.get('/api/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = '20' } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ message: 'Query too short' });
    const searchTerm = `%${q}%`;
    const results = {};
    if (type === 'all' || type === 'posts') {
      results.posts = await query(db,
        `SELECT p.id, p.title, p.body, p.score, p.created_at, u.anon_username
         FROM posts p LEFT JOIN users u ON p.author_id = u.id
         WHERE p.status = 'active' AND (LOWER(p.title) LIKE LOWER($1) OR LOWER(p.body) LIKE LOWER($1))
         ORDER BY p.score DESC LIMIT $2`, [searchTerm, parseInt(limit)]);
    }
    if (type === 'all' || type === 'companies') {
      results.companies = await query(db,
        `SELECT id, name, domain, verified FROM companies WHERE LOWER(name) LIKE LOWER($1) LIMIT $2`,
        [searchTerm, parseInt(limit)]);
    }
    return res.json({ results, query: q });
  } catch (error) { return res.status(500).json({ message: 'Internal server error' }); }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'content-service' }));

// ============ START ============
async function start() {
  await initDB();
  await connectRabbitMQ();
  app.listen(PORT, () => console.log(`[Content Service] 🟢 Running on port ${PORT}`));
}
start().catch(console.error);
module.exports = app;
