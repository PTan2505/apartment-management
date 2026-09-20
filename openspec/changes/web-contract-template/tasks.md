## 1. Storage

- [x] 1.1 A fixed template prefix, accepted document types, a 20 MB ceiling, key derivation that keeps a sanitised original file name, and a download signed with a content-disposition naming that file

## 2. Backend

- [x] 2.1 `GET /contract-template` — what is on file, or that there is none
- [x] 2.2 `POST /contract-template/upload-url` — signed URL for one object of one type
- [x] 2.3 `POST /contract-template` — confirm: prefix, existence and size checked; oversized object deleted; exactly the new object left behind
- [x] 2.4 `GET /contract-template/download` — short-lived signed link, 404 when there is none
- [x] 2.5 `DELETE /contract-template` — storage left with nothing
- [x] 2.6 All of them owner-only, and refusing plainly when storage is unconfigured

## 3. Frontend

- [x] 3.1 API layer and hook
- [x] 3.2 A section above the tenancies list: file name, when uploaded, download / replace / remove; and what to say when there is none
- [x] 3.3 New strings reported for review

## 4. Checks

- [x] 4.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`, `atomic:check`

## 5. Verify against the running API and the real bucket

- [x] 5.1 Upload and confirm: reported on file with name, size and time
- [x] 5.2 Replace: exactly one object remains, and it is the new one
- [x] 5.3 A foreign key is refused; an oversized file is refused and deleted
- [x] 5.4 Download link is signed, expires, and carries the original file name
- [x] 5.5 Remove: storage empty, and the API reports none on file
- [x] 5.6 Asking with nothing on file answers "none" rather than failing

## 6. Verify in a visible browser

- [x] 6.1 Upload from the tenancies screen and read the name back
- [x] 6.2 Download and check the saved file's name
- [x] 6.3 Replace, then remove
- [x] 6.4 390px
- [x] 6.5 Downloading saves the file in place: no new tab, no navigation, saved under the original name
- [x] 6.6 With storage unreachable, the failure is a Vietnamese message on the screen and nothing is saved
