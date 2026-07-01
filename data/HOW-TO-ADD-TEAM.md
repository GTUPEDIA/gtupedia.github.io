# Adding team members

Edit `team.json` and add entries to the `members` array.

## Member shape

```json
{
  "id": "unique-id",
  "name": "Student Name",
  "role": "Team member",
  "course": "BE",
  "branch": "Computer Engineering",
  "semester": "7",
  "college": "LD College of Engineering, Ahmedabad",
  "links": {
    "github": "https://github.com/username",
    "linkedin": "https://linkedin.com/in/username",
    "email": "student@example.com"
  }
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Unique slug, e.g. `priya-patel` |
| `name` | yes | Display name |
| `role` | yes | e.g. Developer, Content, Design |
| `college` | yes | GTU-affiliated college name |
| `branch` | no | Branch or programme |
| `semester` | no | Current semester |
| `course` | no | BE, BBA, BCA, etc. |
| `links` | no | Any of `github`, `linkedin`, `email`, `website` |

After saving, refresh `/team/`. No build step required.
