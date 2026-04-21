import { Router } from 'express';
import { healthController } from '../controllers/healthController';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/health', (req, res) => healthController.health(req, res));

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/container orchestration
 */
router.get('/health/ready', (req, res) => healthController.readiness(req, res));

export default router;
