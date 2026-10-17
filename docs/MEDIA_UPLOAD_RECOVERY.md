# Media Upload Recovery

Recovery is server-authoritative. IndexedDB stores only resumable client state, never authorization secrets.

## Reconciliation algorithm

1. Load local UploadSession by uploadId.
2. Call the authoritative upload-session query.
3. If status is COMPLETED, stop uploading and refresh MediaAsset.
4. If status is CANCELLED or EXPIRED, stop and create a new session.
5. If status is FAILED, apply the failure-code policy; retry only when retryable.
6. If status is UPLOADING/PAUSED/RESUMING, reconcile server-confirmed chunks/bytes and resume only missing work.
7. Never infer completion from local IndexedDB state.

Conflicts between local and server state always resolve in favor of server-confirmed state.
