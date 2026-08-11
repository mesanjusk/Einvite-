// Every invitation — guest-created or admin/dashboard-created — must carry
// at least this many gallery photos before it can go live. Shared so the
// wizard's client-side gate, the server actions, and the publish guard all
// agree on the same number.
export const REQUIRED_PHOTO_COUNT = 5;
