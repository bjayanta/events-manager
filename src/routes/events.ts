import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
} from "../controllers/eventController";

const router: Router = Router();

// Protected by the authentication middleware
router.use(authMiddleware);

// POST /api/events
router.post("/", createEvent);

// PUT /api/events/:eventId
router.put("/:eventId", updateEvent);

// DELETE /api/events/:eventId
router.delete("/:eventId", deleteEvent);

// GET /api/events/myevents
router.get("/myevents", getMyEvents);

export default router;
