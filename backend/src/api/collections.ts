import { Router } from 'express';
import multer from 'multer';
import { CollectionModel, FolderModel, RequestModel } from '../models/Collection';
import { PostmanParser } from '../services/postmanParser';
import { CollectionAnalyzer } from '../services/collectionAnalyzer';
import type { PostmanCollection } from '../types';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.toLowerCase().endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed. Please upload a Postman Collection JSON file.'));
    }
  },
});

// POST /api/collections/import - Import Postman collection
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const workspaceId = req.body.workspaceId;
    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    // Parse JSON
    let collectionData: unknown;
    try {
      const fileContent = req.file.buffer.toString('utf-8');
      collectionData = JSON.parse(fileContent);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON file' });
    }

    // Validate Postman Collection v2.1
    if (!PostmanParser.validateCollection(collectionData)) {
      return res.status(400).json({ error: 'Invalid Postman Collection format. Must be v2.1' });
    }

    const collection = collectionData as PostmanCollection;

    // Extract metadata
    const metadata = PostmanParser.extractMetadata(collection);

    // Create collection record
    const collectionRecord = CollectionModel.create({
      name: metadata.name,
      description: metadata.description,
      schemaVersion: metadata.schemaVersion,
      workspaceId,
    });

    // Parse folders and requests (using temp IDs)
    const { folders: foldersWithTempIds, requests: requestsWithTempIds } = PostmanParser.parseItems(
      collection.item,
      collectionRecord.id
    );

    // Create folder ID mapping (tempId -> actual DB ID)
    const folderIdMap = new Map<string, string>();
    folderIdMap.set('null', 'null'); // For root level items

    // Convert temp folder structure to DB structure and create folders
    const foldersToCreate = foldersWithTempIds.map((folder) => {
      const parentId = folder.parentTempId ? folderIdMap.get(folder.parentTempId) || null : null;
      return {
        name: folder.name,
        parentId,
        collectionId: folder.collectionId,
        order: folder.order,
      };
    });

    // Create folders in order (parents before children)
    const sortedFolders = foldersWithTempIds.sort((a, b) => {
      // Simple sort - in production, would need proper topological sort
      return a.order - b.order;
    });

    const createdFolders: Array<{ id: string; tempId: string }> = [];
    for (const folderWithTempId of sortedFolders) {
      const parentId = folderWithTempId.parentTempId ? folderIdMap.get(folderWithTempId.parentTempId) || null : null;
      const folderData = {
        name: folderWithTempId.name,
        parentId,
        collectionId: folderWithTempId.collectionId,
        order: folderWithTempId.order,
      };
      const created = FolderModel.createMany([folderData]);
      if (created[0]) {
        folderIdMap.set(folderWithTempId.tempId, created[0].id);
        createdFolders.push({ id: created[0].id, tempId: folderWithTempId.tempId });
      }
    }

    // Map requests to use actual folder IDs
    const requestsWithFolderIds = requestsWithTempIds.map((req) => {
      const folderId = req.parentFolderTempId ? folderIdMap.get(req.parentFolderTempId) || null : null;
      return {
        name: req.name,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        folderId,
        collectionId: req.collectionId,
        rawJson: req.rawJson,
      };
    });

    const createdRequests = RequestModel.createMany(requestsWithFolderIds);

    // Run analysis on all requests
    for (const request of createdRequests) {
      try {
        const analysis = CollectionAnalyzer.analyzeRequest(request, request.rawJson);
        // Ensure risk is always set (analysis should always return a risk)
        if (!analysis.risk) {
          analysis.risk = 'Write'; // Fallback default
        }
        RequestModel.updateAnalysis(request.id, analysis);
      } catch (error) {
        console.error(`Error analyzing request ${request.id}:`, error);
        // If analysis fails, set default risk
        RequestModel.updateAnalysis(request.id, {
          variables: [],
          risk: 'Write',
          hasScripts: false,
          warnings: ['Analysis failed - using default risk level'],
        });
      }
    }

    res.status(201).json({
      id: collectionRecord.id,
      name: collectionRecord.name,
      requestCount: requestsWithFolderIds.length,
      folderCount: foldersWithTempIds.length,
    });
  } catch (error) {
    console.error('Error importing collection:', error);
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('JSON')) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
      if (error.message.includes('Postman')) {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to import collection. Please check the file format and try again.' });
  }
});

// GET /api/collections - List collections for workspace
router.get('/', (req, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query parameter is required' });
    }

    const collections = CollectionModel.findByWorkspace(workspaceId);
    const collectionsWithCounts = collections.map((collection) => {
      const requestCount = RequestModel.countByCollection(collection.id);
      return {
        ...collection,
        requestCount,
      };
    });

    res.json(collectionsWithCounts);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// GET /api/collections/:id - Get collection details
router.get('/:id', (req, res) => {
  try {
    const collection = CollectionModel.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const folders = FolderModel.findByCollection(collection.id);
    const requests = RequestModel.findByCollection(collection.id);

    res.json({
      ...collection,
      folders,
      requests,
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', (req, res) => {
  try {
    const deleted = CollectionModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

export default router;
