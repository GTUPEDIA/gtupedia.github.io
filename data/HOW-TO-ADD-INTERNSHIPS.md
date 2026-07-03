# Adding internships

Edit `internships.json` to list openings offered by companies for GTU students.

## Listing shape

```json
{
  "id": "company-role-slug",
  "company": "Company Name",
  "companyUrl": "https://example.com",
  "role": "Job title shown to students",
  "domain": "Software & IT",
  "type": "Stipend",
  "stipend": "₹5,000/month or Unpaid / Certificate",
  "location": "Ahmedabad",
  "mode": "Remote",
  "duration": "3 months",
  "courses": ["BE", "BCA", "MBA"],
  "skills": ["JavaScript", "React"],
  "eligibility": "Who can apply — year, branch, portfolio, etc.",
  "deadline": "31 Aug 2026 or Rolling",
  "posted": "June 2026",
  "summary": "Short description students will read on the card.",
  "applyUrl": "https://example.com/careers"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Unique slug |
| `company` | yes | Employer name |
| `companyUrl` | no | Company homepage |
| `role` | yes | Internship title |
| `domain` | yes | Used for filters — e.g. `Software & IT`, `Engineering`, `Management`, `Design & Media`, `Other` |
| `type` | no | `Stipend`, `Paid`, `Unpaid / Certificate` |
| `stipend` | no | Free-text stipend line |
| `location` | no | City or region |
| `mode` | no | `Remote`, `Hybrid`, `On-site` |
| `duration` | no | e.g. `2–3 months` |
| `courses` | no | GTU programmes this suits — `BE`, `BBA`, `BCA`, `MBA`, `MCA`, etc. |
| `skills` | no | Array of skill tags |
| `eligibility` | no | Who should apply |
| `deadline` | no | Last date or `Rolling` |
| `posted` | no | When listed on GTUPEDIA |
| `summary` | yes | Card description |
| `applyUrl` | yes | Official apply or careers link |

## After saving

Refresh `/internships/`. No build step required.

To suggest a listing, contact **Team GTUPEDIA** or a **Campus Ambassador**.
