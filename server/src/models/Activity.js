import mongoose from 'mongoose';

// An append-only record of what happened on a board — who did it and when.
// We snapshot the actor's name so the feed reads correctly even if the user is
// later removed, and store a ready-made `text` so clients don't reconstruct it.
const activitySchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    type: { type: String, required: true }, // e.g. card.created, card.moved
    text: { type: String, required: true }, // human-readable summary
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ board: 1, createdAt: -1 });

activitySchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Activity = mongoose.model('Activity', activitySchema);
