---
description: how to run the mentorship platform
---

1. Ensure MongoDB is running on your machine.
   - Open MongoDB Compass and connect to `localhost:27017` to verify.

// turbo
2. Run the application from the root directory:
```bash
cmd /c npm run dev
```

3. The application will start three processes concurrently:
   - **Backend**: Express server on port 5000.
   - **Frontend**: Angular dev server on port 4200.
   - **Electron**: Desktop window wrapper.

Note: If you see an "ERR_CONNECTION_REFUSED" in the Electron window at first, just wait a few seconds for the Angular server to finish building and then press `Ctrl+R` inside the window to reload.
