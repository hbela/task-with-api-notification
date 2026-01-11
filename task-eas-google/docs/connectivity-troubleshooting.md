# Connectivity Troubleshooting

If you are seeing **"Network request failed"** errors, it typically means your mobile device/emulator cannot reach the backend server.

## 1. Check Server Status

Ensure your backend server is running:
```bash
cd server
npm run dev
```

It should be listening on `0.0.0.0` (all interfaces):
```
Server listening at http://127.0.0.1:3001
Server listening at http://192.168.1.X:3001
```

## 2. Configure API URL

The app needs to know where the server is located. This varies by environment.

### A. Android Emulator (Standard)
I have added automatic detection for this!
- **Effect**: It will automatically try `http://10.0.2.2:3001`.
- **Action**: No action needed if you are using the official Android Emulator.

### B. Physical Device (Real Phone)
You MUST use your computer's local IP address. `localhost` will not work.

1. Find your computer's IP:
   - **Windows**: `ipconfig` (Look for "IPv4 Address", e.g., `192.168.1.5`)
   - **Mac/Linux**: `ifconfig`

2. Update `.env` in the root (create if missing):
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3001
   ```
   *Example:* `EXPO_PUBLIC_API_URL=http://192.168.1.5:3001`

3. **Restart Expo**: You must restart the development server for `.env` changes to pick up.
   ```bash
   npx expo start -c
   ```
   (The `-c` flag clears the cache, which is often helpful)

### C. iOS Simulator
- **Effect**: Defaults to `http://localhost:3001`.
- **Action**: Should work out of the box.

## 3. Firewall Issues

If you are on Windows, ensure your firewall is not blocking Node.js.
- Allow `node` to accept incoming connections on port `3001`.
- For testing, you can try temporarily disabling the firewall.

## 4. Ngrok Alternative (If all else fails)

If you can't connect via local IP due to network isolation:

1. Use [ngrok](https://ngrok.com/) to tunnel your localhost:
   ```bash
   ngrok http 3001
   ```
2. Copy the https URL (e.g., `https://a1b2c3d4.ngrok.io`)
3. Update `.env`:
   ```
   EXPO_PUBLIC_API_URL=https://a1b2c3d4.ngrok.io
   ```
