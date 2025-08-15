import { Request, Response } from "express";
import Event, { IEvent } from "../models/Event";
import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Request with the user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// Create
export const createEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, description, startTime, endTime, participants, recurrence } =
      req.body;

    // Basic validation
    if (!title || !startTime) {
      res
        .status(400)
        .json({ message: "Title and startTime are required fields." });
      return;
    }

    // Validation
    if (
      recurrence &&
      recurrence.type &&
      !["none", "daily", "weekly", "monthly"].includes(recurrence.type)
    ) {
      res.status(400).json({
        message:
          "Invalid recurrence type. Must be one of: none, daily, weekly, monthly.",
      });
      return;
    }

    // check the user id exists or not
    if (!req.user?.id) {
      res
        .status(401)
        .json({ message: "Authentication failed. User ID not found." });
      return;
    }

    // Create the new event document
    const newEvent: IEvent = new Event({
      title,
      description,
      startTime,
      endTime,
      creator: new mongoose.Types.ObjectId(req.user.id),
      participants: participants || [],
      recurrence: recurrence || { type: "none" },
      seriesId:
        recurrence.type !== "none"
          ? uuidv4()
          : new mongoose.Types.ObjectId().toString(),
    });

    // Save the event to the database
    const savedEvent = await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: savedEvent,
    });
  } catch (error: any) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update
export const updateEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      participants,
      recurrence,
      updateScope,
    } = req.body;

    // check the user id exists or not
    if (!req.user?.id) {
      res
        .status(401)
        .json({ message: "Authentication failed. User ID not found." });
      return;
    }

    // Find the event
    const eventToUpdate = await Event.findById(eventId);
    if (!eventToUpdate) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    // Check if the authenticated user is the event creator
    if (eventToUpdate.creator.toString() !== req.user.id) {
      res
        .status(403)
        .json({ message: "You are not authorized to update this event." });
      return;
    }

    // Prepare the updates to be applied
    const updates: any = {
      title,
      description,
      startTime,
      endTime,
      participants,
      recurrence,
    };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (participants !== undefined) updates.participants = participants;
    if (recurrence !== undefined) updates.recurrence = recurrence;

    // Determine the query based on the updateScope
    let query: any;
    let updateMessage: string;

    switch (updateScope) {
      case "thisAndFollowing":
        query = {
          seriesId: eventToUpdate.seriesId,
          startTime: { $gte: eventToUpdate.startTime },
        };
        updateMessage =
          "This event and all following events updated successfully.";
        break;

      case "allEvents":
        query = { seriesId: eventToUpdate.seriesId };
        updateMessage = "All events in the series updated successfully.";
        break;

      default: // including 'thisEvent'
        query = { _id: eventId };
        updateMessage = "Event updated successfully.";
        break;
    }

    // Perform the update
    await Event.updateMany(query, updates);
    res.json({ message: updateMessage });
  } catch (error: any) {
    console.error("Error updating event:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete
export const deleteEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { deleteScope } = req.body;

    // Check the user id exists or not
    if (!req.user?.id) {
      res
        .status(401)
        .json({ message: "Authentication failed. User ID not found." });
      return;
    }

    // Find the event to be deleted
    const eventToDelete = await Event.findById(eventId);
    if (!eventToDelete) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    // Check if the authenticated user is the event creator
    if (eventToDelete.creator.toString() !== req.user.id) {
      res
        .status(403)
        .json({ message: "You are not authorized to delete this event." });
      return;
    }

    let query: any;
    let deleteMessage: string;

    switch (deleteScope) {
      case "thisAndFollowing":
        query = {
          seriesId: eventToDelete.seriesId,
          startTime: { $gte: eventToDelete.startTime },
        };
        deleteMessage =
          "This event and all following events deleted successfully.";
        break;

      case "allEvents":
        query = { seriesId: eventToDelete.seriesId };
        deleteMessage = "All events in the series deleted successfully.";
        break;

      case "thisEvent":
      default:
        query = { _id: eventId };
        deleteMessage = "Event deleted successfully.";
        break;
    }

    // Perform the deletion
    await Event.deleteMany(query);
    res.json({ message: deleteMessage });
  } catch (error: any) {
    console.error("Error deleting event:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all
export const getMyEvents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check the user id exists or not
    if (!req.user?.id) {
      res
        .status(401)
        .json({ message: "Authentication failed. User ID not found." });
      return;
    }

    console.log(req.user.email);

    // Find all events where the user is either the creator or a participant
    const events = await Event.find({
      $or: [
        { creator: new mongoose.Types.ObjectId(req.user.id) },
        { participants: req.user.email?.toLowerCase() }, // Find in array
      ],
    });

    res.status(200).json({
      message: "Events retrieved successfully",
      events,
    });
  } catch (error: any) {
    console.error("Error retrieving events:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
