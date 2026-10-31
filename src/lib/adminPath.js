// The admin page lives at an unlisted URL with no link to it anywhere in the
// app. That keeps it out of sight, not secure: the path still ships in the
// bundle. The real protection is server-side — admin_overview() refuses every
// account that isn't in the admins table.
export const ADMIN_PATH = '/console-nsrnqzrv9m59'
