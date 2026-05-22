# VedaAI Manual Verification & Testing Guide

This guide describes how to run and manually test all implementation fixes across the backend queue, Gemini provider, dynamic fallback generator, normalization schemas, and the frontend socket updates.

---

## 1. Local Prerequisites & Running

### Starting Redis & MongoDB
Make sure local Redis and MongoDB are running on your system. If using Docker:
```bash
docker run -d -p 6379:6379 redis
docker run -d -p 27017:27017 mongodb
```

### Starting the Backend
From the workspace root, run:
```bash
npm run dev --prefix backend
# Server will boot on port 4001, verifying MongoDB and BullMQ connection
```

### Starting the Frontend
From the workspace root, run:
```bash
npm run dev --prefix frontend
# Next.js app will start on http://localhost:3000
```

---

## 2. Testing Scenarios

### Scenario A: Create Form Validation (`marks >= totalQuestions`)
1. Go to http://localhost:3000/create
2. Set "Total Questions count" to `10`.
3. Set "Total Marks" to `5`.
4. Click "Generate Assessment Paper".
5. **Expected Output**: The form should fail validation and display: *"Total marks must be greater than or equal to the total questions count"*.
6. Correct the marks to `30`, upload a file (PDF or TXT), and submit.
7. **Expected Output**: The paper is successfully queued, and you are redirected to the Dashboard.

### Scenario B: Active Socket Progress & Cancellation
1. Start generating a paper with a large reference document or in a slow network state.
2. The card on the Dashboard should show **"Queued"** or **"Generating (X%)"**.
3. Click the assessment card or open its details page at `/assignments/[id]`.
4. Observe the progress checklist updating in real-time.
5. Click **"Cancel Generation"** on the Dashboard card or the details page progress panel.
6. **Expected Output**: 
   - A confirmation alert appears. Upon accepting, the UI updates instantly.
   - The status badge changes to **"Cancelled"** with an amber alert style.
   - The BullMQ worker logs `Job cancelled mid-process, aborting...` and halts.
   - You can click **"Retry Generation"** on the card to restart generation.

### Scenario C: Gemini API Quota Limit Fallback
1. To simulate a quota block, set `GEMINI_API_KEY=invalid_key` or trigger multiple massive generations rapidly to trigger a 429 quota exhaustion.
2. Alternatively, block internet connection briefly or run in Demo Mode (leave `GEMINI_API_KEY` blank).
3. Generate a paper.
4. **Expected Output**:
   - The backend service catches the error.
   - Logs show: `[AI Service] Quota limit exceeded / 429. Falling back automatically to dynamic Mock Generation Mode!`.
   - A perfect, high-quality, normalized paper matching your requested title, total questions, and difficulty is generated and saved successfully.
   - No crashes or infinite spinner loops occur.

### Scenario D: PDF Rendering & Print Alignment
1. Open any completed assessment details page (`/assignments/[id]`).
2. Verify that MCQ choices are displayed with disabled radio inputs.
3. Click **"Download PDF"** to get the printable file from the backend, or click **"Print"** to use the browser print layout.
4. **Expected Output**:
   - Long question titles do not overlap with the right-aligned marks labels (correct right-padding is maintained).
   - Questions and options do not get cut in half across page breaks (height estimation pushes them onto a new page together).
