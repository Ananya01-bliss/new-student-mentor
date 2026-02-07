# Mentor–Student Backend API (MEAN Stack)

Base URL: `http://localhost:5000` (or `PORT` from env)

Auth: Send JWT in header: `x-auth-token: <token>`

---

## Auth (`/api/auth`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{ email, password, role, name, ... }` | Register student or mentor. Student: `usn, domain, specialization?, year?`. Mentor: `maxStudents?, summary?, shortDescription?, projectsDone?, expertise[]` |
| POST | `/login` | `{ email, password, role? }` | Returns `{ token, user }` |
| GET | `/mentors` | - | List all mentors (no auth) |
| GET | `/:id` | - | Get user by id (no auth) |

---

## Messages / Chat (`/api/messages`) — *Auth required*

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/` | `{ receiverId, content }` | Send message. Real-time: Socket.io emits `new_message` to sender and receiver rooms. |
| GET | `/conversations` | - | List current user's conversations (last message, unread count). |
| GET | `/:otherUserId` | - | Get messages between current user and `otherUserId`. |
| PUT | `/read/:otherUserId` | - | Mark messages from `otherUserId` as read. |

**Socket.io (client):** Connect, then `socket.emit('join', userId)` to join your room. Listen for `new_message`, optional `typing` / `stop_typing`.

---

## Projects (`/api/projects`) — *Auth required*

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/` | `{ title, idea?, guidanceNeeded?, mentorId?, keywords[]? }` | Create or update project (by student). |
| GET | `/student` | - | List current student's projects. |
| PUT | `/:id` | `{ title?, idea?, guidanceNeeded?, keywords? }` | Update project (owner only). |
| DELETE | `/:id` | - | Delete project (owner only). |
| GET | `/:projectId/suggested-mentors` | - | **Intelligent matching:** suggests mentors from project keywords + idea + guidanceNeeded + title. Returns `{ matchScore, matchedKeywords, ...mentor }[]` (top 10). |
| GET | `/suggestions/by-keywords?keywords=ml,web,api` | - | Suggest mentors by query keywords (comma/space separated). |
| POST | `/suggestions` | `{ keywords: [] }` or `{ keyword: "ml web" }` | Same as above via body. |
| GET | `/mentor/requests` | - | Pending requests for current mentor. |
| POST | `/mentor/respond` | `{ projectId, status: 'approved' \| 'rejected' }` | Approve/reject request. |
| GET | `/mentor/mentees` | - | Current mentor's approved/in_progress mentees. |
| GET | `/mentor/stats` | - | `{ activeMentees, pendingRequests, completedProjects }`. |
| POST | `/mentor/complete` | `{ projectId }` | Mark project completed. |
| POST | `/add-milestone` | `{ projectId, title, description?, dueDate? }` | Mentor adds milestone. |
| POST | `/submit-milestone` | `{ projectId, milestoneId, submission }` | Student submits text. |
| POST | `/submit-milestone-file` | form: `file`, `projectId`, `milestoneId` | Student uploads file (PDF/image). |
| POST | `/cancel-submission` | `{ projectId, milestoneId }` | Student cancels submission. |
| POST | `/evaluate-milestone` | `{ projectId, milestoneId, status: 'completed' \| 'pending', feedback? }` | Mentor evaluates. |

---

## Mentor matching (keyword logic)

- **Sources:** project `keywords`, `idea`, `guidanceNeeded`, `title` (for project-based suggest); or raw keywords (suggest-by-keywords).
- **Scoring:** Expertise exact/word match = 3, expertise partial = 2, summary/shortDescription/projectsDone contains keyword = 1. Sorted by total score, top 10 returned with `matchScore` and `matchedKeywords[]`.

---

## Health

- `GET /` — API running message.
- `GET /api/health` — `{ ok: true, db: 'connected' | 'disconnected' }`.

---

## Environment

- `PORT` — default 5000
- `MONGODB_URI` — default `mongodb://127.0.0.1:27017/mentor-student-db`
- `JWT_SECRET` — default `your_jwt_secret` (set in production)
