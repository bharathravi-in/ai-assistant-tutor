
# Diagnostic Script for Docker Read-Only error

1. Check if the directory is actually writable:
   ```bash
   touch /opt/ai-assistant-tutor/test_file && rm /opt/ai-assistant-tutor/test_file
   ```

2. If that fails with "Read-only file system", check the mount status:
   ```bash
   mount | grep ' /opt'
   ```

3. If it's a mount issue, you might need to remount:
   ```bash
   sudo mount -o remount,rw /
   # or for a specific partition
   sudo mount -o remount,rw /opt
   ```

4. If you have the code in your home directory, try running it from there instead:
   ```bash
   cd ~/self/projects/hackathon/Gov_Teaching
   sudo docker-compose up
   ```

5. Ensure all subdirectories exist:
   ```bash
   mkdir -p backend frontend
   ```
