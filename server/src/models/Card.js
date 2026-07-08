import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      maxlength: 280,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    position: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Optimistic-concurrency counter: bumped on every edit. Phase 3 uses it to
    // detect conflicting simultaneous edits (client sends the version it saw).
    version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Loading a whole board sorts cards within each list by position.
cardSchema.index({ board: 1, list: 1, position: 1 });

cardSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Card = mongoose.model('Card', cardSchema);
