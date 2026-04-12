import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/database.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Memory storage for multer (we'll stream to Supabase)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Upload file to Supabase Storage via Backend Proxy
 * POST /api/storage/upload
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const bucket = req.body.bucket || 'attachments';
    const path = req.body.path || `${Date.now()}_${file.originalname}`;

    console.log(`[Storage] Uploading ${file.originalname} to ${bucket}/${path}`);

    // Upload to Supabase using Admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('[Storage Error]', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Upload successful',
      path: data.path
    });
  } catch (error) {
    console.error('[Storage Exception]', error);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

export default router;
