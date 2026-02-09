# Deployment Verification Checklist

Use this checklist to verify your deployment is working correctly.

## 📋 Pre-Verification: Check Configuration

### Backend (Render)
- [ ] Visit your Render backend URL (e.g., `https://collab-suite-backend.onrender.com/`)
  - Should display: **"Server is running..."**
  - If not, check Render logs for errors

- [ ] Check Render Environment Variables (Settings → Environment)
  - [ ] `MONGO_URL` - Set to MongoDB Atlas connection string
  - [ ] `JWT_SECRET` - Set (auto-generated or custom)
  - [ ] `CLIENT_URL` - Set to your Vercel URL (e.g., `https://your-app.vercel.app`)
  - [ ] `PORT` - Should be `3000`
  - [ ] `NODE_ENV` - Should be `production`

- [ ] Check Render Logs (Logs tab)
  - [ ] Look for: `🚀 Server running on port 3000`
  - [ ] Look for: `✅ MongoDB Connected Successfully`
  - [ ] No CORS errors
  - [ ] No connection errors

### Frontend (Vercel)
- [ ] Check Vercel Environment Variables (Settings → Environment Variables)
  - [ ] `VITE_API_URL` - Set to your Render backend URL
  - [ ] Should be set for Production, Preview, and Development

- [ ] Visit your Vercel URL
  - [ ] Application loads without errors
  - [ ] No blank screen

---

## 🧪 Feature Testing

### 1. Authentication ✅
- [ ] **Register New Account**
  - [ ] Click "Get Started" or "Sign Up"
  - [ ] Fill in email, name, password
  - [ ] Click "Register"
  - [ ] Should redirect to dashboard

- [ ] **Login**
  - [ ] Logout if logged in
  - [ ] Click "Sign In"
  - [ ] Enter credentials
  - [ ] Should redirect to dashboard

### 2. Workspace Management 🏢
- [ ] **Create Workspace**
  - [ ] Click "Create Workspace" or similar
  - [ ] Enter workspace name
  - [ ] Should create successfully

- [ ] **Invite Members** (Optional)
  - [ ] Click "Invite" or similar
  - [ ] Enter email address
  - [ ] Should send invitation

### 3. Video Calls 🎥 (CRITICAL)
This is the main feature that was broken!

- [ ] **Open Browser Console** (F12 → Console tab)
  - [ ] Check for Socket.io connection success
  - [ ] No CORS errors
  - [ ] No WebSocket connection errors

- [ ] **Start a Meeting**
  - [ ] Go to Meetings page
  - [ ] Click "New Meeting" or "Start Meeting"
  - [ ] Allow camera/microphone permissions
  - [ ] Should see your video preview

- [ ] **Join Meeting (2 Devices/Browsers)**
  - [ ] Copy meeting link/ID
  - [ ] Open in another browser or device (or incognito window)
  - [ ] Join the meeting
  - [ ] **VERIFY**: Both participants can see each other's video
  - [ ] **VERIFY**: Participant names are displayed correctly

- [ ] **Test Controls**
  - [ ] Toggle microphone (mute/unmute)
  - [ ] Toggle camera (on/off)
  - [ ] Test screen sharing (if available)
  - [ ] Leave meeting

**If video calls don't work:**
1. Check browser console for errors
2. Verify both users are on the same meeting ID
3. Try different browsers (Chrome/Edge recommended)
4. Check if firewall is blocking WebRTC

### 4. Real-Time Chat 💬
- [ ] **Create Conversation**
  - [ ] Click "New Chat" or similar
  - [ ] Select or invite users
  - [ ] Create conversation

- [ ] **Send Messages**
  - [ ] Type a message
  - [ ] Click send
  - [ ] Message should appear instantly

- [ ] **Test Real-Time Sync** (2 Devices/Browsers)
  - [ ] Open chat on two devices
  - [ ] Send message from one device
  - [ ] **VERIFY**: Message appears on other device instantly

- [ ] **File Upload** (Optional)
  - [ ] Upload an image or file
  - [ ] Should upload and display

### 5. Document Collaboration 📝
- [ ] **Create Document**
  - [ ] Go to Documents page
  - [ ] Click "New Document"
  - [ ] Enter document name
  - [ ] Should create successfully

- [ ] **Edit Document**
  - [ ] Open the document
  - [ ] Type some text
  - [ ] Should save automatically

- [ ] **Test Real-Time Collaboration** (2 Devices/Browsers)
  - [ ] Open same document on two devices
  - [ ] Type on one device
  - [ ] **VERIFY**: Changes appear on other device in real-time
  - [ ] **VERIFY**: Cursor tracking works (see other user's cursor)

### 6. Whiteboard 🎨
- [ ] **Open Whiteboard**
  - [ ] Go to Whiteboard page
  - [ ] Should load canvas

- [ ] **Draw**
  - [ ] Select pen tool
  - [ ] Draw on canvas
  - [ ] Should draw smoothly

- [ ] **Test Real-Time Sync** (2 Devices/Browsers)
  - [ ] Open whiteboard on two devices
  - [ ] Draw on one device
  - [ ] **VERIFY**: Drawing appears on other device instantly

### 7. Task Board ✅
- [ ] **Create Task**
  - [ ] Go to Tasks page
  - [ ] Click "Add Task" or similar
  - [ ] Enter task details
  - [ ] Should create successfully

- [ ] **Drag and Drop**
  - [ ] Drag task between columns (To Do → In Progress → Done)
  - [ ] Should move smoothly

- [ ] **Test Real-Time Sync** (2 Devices/Browsers)
  - [ ] Open tasks on two devices
  - [ ] Move a task on one device
  - [ ] **VERIFY**: Task moves on other device instantly

---

## 🐛 Common Issues & Solutions

### Issue: "Server is running..." doesn't appear
**Solution**: 
- Check Render logs for errors
- Verify `MONGO_URL` is correct
- Check MongoDB Atlas network access allows all IPs (0.0.0.0/0)

### Issue: Frontend shows blank screen
**Solution**:
- Check browser console for errors
- Verify `VITE_API_URL` in Vercel is correct
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: CORS errors in console
**Solution**:
- Verify `CLIENT_URL` in Render matches your Vercel URL exactly
- No trailing slash in URLs
- Redeploy backend after updating `CLIENT_URL`

### Issue: Socket.io connection failed
**Solution**:
- Check browser console for exact error
- Verify `VITE_API_URL` in Vercel
- Verify `CLIENT_URL` in Render
- Check Render logs for Socket.io errors

### Issue: Video calls don't connect
**Solution**:
- Verify Socket.io is connected (check console)
- Both users must be on the same meeting ID
- Try different browsers (Chrome/Edge work best)
- Check if firewall is blocking WebRTC
- For users behind restrictive NATs, you may need TURN servers

### Issue: Real-time features delayed or not working
**Solution**:
- Verify Socket.io connection in console
- Check Render logs for Socket.io events
- Ensure both devices are in the same room/workspace

### Issue: Render backend is slow (30-60 seconds to respond)
**Cause**: Free tier sleeps after 15 minutes of inactivity
**Solutions**:
- First request after sleep takes time to wake up
- Upgrade to Render Starter ($7/month) for always-on
- Use UptimeRobot to ping backend every 10 minutes

---

## ✅ Success Criteria

Your deployment is successful if:
- ✅ Backend responds with "Server is running..."
- ✅ Frontend loads without errors
- ✅ Can register and login
- ✅ **Video calls work between 2 devices**
- ✅ **Real-time chat messages sync instantly**
- ✅ **Document collaboration works in real-time**
- ✅ **Whiteboard syncs across devices**
- ✅ **Task board updates sync in real-time**
- ✅ No CORS errors in console
- ✅ No Socket.io connection errors

---

## 📊 What to Share for Troubleshooting

If you encounter issues, share:
1. **Browser Console Errors** (F12 → Console tab)
2. **Render Backend Logs** (from Render dashboard)
3. **Environment Variables** (redact sensitive values)
4. **Specific feature that's not working**
5. **Error messages you're seeing**

---

## 🎉 Next Steps After Verification

Once everything works:
1. ✅ Test with real users
2. ✅ Monitor Render logs for errors
3. ✅ Consider upgrading Render to paid tier if needed
4. ✅ Set up custom domain (optional)
5. ✅ Configure TURN servers for better video call reliability (optional)
