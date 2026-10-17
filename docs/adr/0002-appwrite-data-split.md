# ADR 0002 — Split Appwrite data by workload

Status: Accepted

Use:

- TablesDB for transactional structured domain data.
- DocumentsDB for flexible JSON payloads.
- VectorsDB for embeddings/similarity search.
- Storage for binary assets.

This avoids forcing one data model onto every workload.
