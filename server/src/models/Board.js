import mongoose from 'mongoose';

export const ROLES = ['owner', 'member'];

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, default: 'member' },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: 120,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Fast lookup of "boards this user belongs to".
boardSchema.index({ 'members.user': 1 });

// Returns the membership subdoc for a user, or undefined.
boardSchema.methods.membershipOf = function membershipOf(userId) {
  const id = String(userId);
  return this.members.find((m) => String(m.user) === id);
};

boardSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Board = mongoose.model('Board', boardSchema);
