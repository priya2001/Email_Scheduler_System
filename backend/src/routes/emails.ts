import express from 'express';
import {
  createEmail,
  createBulkEmails,
  getEmails,
  getEmail,
  updateEmail,
  deleteEmail,
} from '../controllers/emailController';

const router = express.Router();

// Email routes
router.post('/', createEmail);           // Create email
router.post('/bulk', createBulkEmails);   // Create emails in bulk
router.get('/', getEmails);              // Get all emails
router.get('/:id', getEmail);            // Get single email
router.put('/:id', updateEmail);         // Update email
router.delete('/:id', deleteEmail);      // Delete email

export default router;
