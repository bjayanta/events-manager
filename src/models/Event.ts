import mongoose, { Document, Schema } from "mongoose";

// Recurrence object
export interface IRecurrence {
  type: "none" | "daily" | "weekly" | "monthly";
  interval?: number;
  until?: Date;
}

// Event document
export interface IEvent extends Document {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  creator: Schema.Types.ObjectId;
  participants: string[];
  recurrence: IRecurrence;
  seriesId: string;
  createdAt: Date;
}

// Recurrence schema
const recurrenceSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      required: true,
      default: "none",
    },
    interval: {
      type: Number,
      min: 1,
    },
    until: {
      type: Date,
    },
  },
  { _id: false }
);

// Event schema
const EventSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, "Event title is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startTime: {
    type: Date,
    required: [true, "Event start time is required"],
  },
  endTime: {
    type: Date,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: {
    type: [String], // Ids or emails
    default: [],
  },
  recurrence: {
    type: recurrenceSchema,
    required: true,
    default: { type: "none" },
  },
  seriesId: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IEvent>("Event", EventSchema);
