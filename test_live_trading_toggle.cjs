// Test script to verify LIVE Trading toggle
// We can't easily spin up the full Express server in a script without port conflicts, 
// so we'll mock the Express req/res and directly call the route handler.

// Wait, server.ts starts the Express server immediately. 
// A better way is to write a script that sends HTTP requests to the running server, 
// but we don't want to rely on the server running.
