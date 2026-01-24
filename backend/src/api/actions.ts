import { Router } from 'express';
import { RequestModel, FolderModel } from '../models/Collection';
import { ActionTransformer } from '../services/actionTransformer';
import type { Action } from '../services/actionTransformer';

const router = Router();

// GET /api/actions?collectionId=xxx - Get all actions for a collection
router.get('/', (req, res) => {
  try {
    const collectionId = req.query.collectionId as string;
    if (!collectionId) {
      return res.status(400).json({ error: 'collectionId query parameter is required' });
    }

    const requests = RequestModel.findByCollection(collectionId);
    const folders = FolderModel.findByCollection(collectionId);

    // Build folder map for path resolution
    const folderMap = new Map(folders.map((f) => [f.id, f]));

    // Transform requests to actions
    const actions: Action[] = requests.map((request) =>
      ActionTransformer.transformRequest(request, folders, folderMap)
    );

    res.json(actions);
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

export default router;
