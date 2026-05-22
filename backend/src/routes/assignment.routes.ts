import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { assignmentController } from '../controllers/assignment.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { apiRateLimiter } from '../middlewares/rateLimiter.middleware';
import {
  CreateAssignmentSchema,
  RegenerateAssignmentQuerySchema,
  GetAssignmentSchema,
} from '../validators/assignment.validator';

const router = Router();

// Configure multer to load files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB limit
  },
  fileFilter: (req: Request, file: any, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed.'));
    }
  },
});

// Applied rate limiting to create and regeneration endpoints
router.post(
  '/',
  apiRateLimiter,
  upload.single('file'),
  // Add request transformation since form-data comes in as text
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.questionTypes && typeof req.body.questionTypes === 'string') {
      try {
        req.body.questionTypes = JSON.parse(req.body.questionTypes);
      } catch (err) {
        req.body.questionTypes = [req.body.questionTypes];
      }
    }
    next();
  },
  validateRequest(CreateAssignmentSchema),
  assignmentController.createAssignment
);

router.get('/', assignmentController.getAssignments);

router.get(
  '/:id',
  validateRequest(GetAssignmentSchema),
  assignmentController.getAssignmentById
);

router.delete(
  '/:id',
  validateRequest(GetAssignmentSchema),
  assignmentController.deleteAssignment
);

router.post(
  '/:id/cancel',
  validateRequest(GetAssignmentSchema),
  assignmentController.cancelAssignment
);

router.post(
  '/:id/regenerate',
  apiRateLimiter,
  validateRequest(RegenerateAssignmentQuerySchema),
  assignmentController.regenerateAssignment
);

router.get(
  '/:id/pdf',
  validateRequest(GetAssignmentSchema),
  assignmentController.downloadPDF
);

export default router;
