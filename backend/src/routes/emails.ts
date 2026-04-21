import express from 'express';
import {
  createEmail,
  getEmails,
  getEmail,
  updateEmail,
  deleteEmail,
} from '../controllers/emailController';

const router = express.Router();

// Email routes
router.post('/', createEmail);           // Create email
router.get('/', getEmails);              // Get all emails
router.get('/:id', getEmail);            // Get single email
router.put('/:id', updateEmail);         // Update email
router.delete('/:id', deleteEmail);      // Delete email

export default router;
