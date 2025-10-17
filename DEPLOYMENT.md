# Deployment Guide - Glass Optimizer

## Deploy to Dokploy

This application is ready to deploy on Dokploy using Docker.

### Prerequisites
- A VPS with Dokploy installed
- Git repository for your code (GitHub, GitLab, etc.)

### Deployment Steps

1. **Push your code to a Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create a new application in Dokploy**
   - Log in to your Dokploy dashboard
   - Click "Create Application"
   - Select "Docker" as the build method
   - Connect your Git repository

3. **Configure the application**
   - **Build Method**: Dockerfile
   - **Dockerfile Path**: `./Dockerfile` (default)
   - **Port**: `8080`
   - **Domain**: Add your custom domain or use the Dokploy subdomain

4. **Environment Variables** (Optional)
   If you need to customize the port, add:
   ```
   PORT=8080
   ```

5. **Deploy**
   - Click "Deploy"
   - Dokploy will build the Docker image and start the application
   - Your application will be available at your configured domain

### Volume Mounting (Optional)

If you want to persist the database across deployments, configure a volume mount in Dokploy:

- **Host Path**: `/var/dokploy/apps/<your-app>/database`
- **Container Path**: `/app/database`

This will keep your SQLite database even after redeployments.

### Application URLs

After deployment, your application will have these routes:
- `/` - Dashboard
- `/designer` - Glass design tool
- `/optimizer` - Sheet optimization tool
- `/api/health` - Health check endpoint

### Updating the Application

To update your application:
1. Push changes to your Git repository
2. In Dokploy, click "Redeploy" on your application
3. Dokploy will rebuild and restart with the latest code

### Troubleshooting

**Container fails to start:**
- Check Dokploy logs for error messages
- Ensure port 8080 is not blocked
- Verify the database directory has write permissions

**Database issues:**
- If using volume mounts, ensure the host directory exists and has proper permissions
- Database is automatically created on first run

**Static files not loading:**
- Verify the `static/` and `templates/` directories are in your Git repository
- Check browser console for 404 errors

### Local Testing

Before deploying to Dokploy, test locally:

```bash
# Build the image
docker build -t glass-optimizer .

# Run the container
docker run -d -p 8080:8080 --name glass-optimizer glass-optimizer

# Test the application
curl http://localhost:8080/

# View logs
docker logs glass-optimizer

# Stop and remove
docker stop glass-optimizer && docker rm glass-optimizer
```

### Performance Notes

- The application uses SQLite, which is suitable for small to medium workloads
- For production use with high traffic, consider:
  - Using a volume mount for database persistence
  - Setting up regular database backups
  - Monitoring container resource usage

### Security Recommendations

1. **Use HTTPS**: Configure SSL/TLS in Dokploy
2. **Firewall**: Ensure only necessary ports are open
3. **Updates**: Keep the application and Docker base images updated
4. **Backups**: Regularly backup the database directory

---

For more information about Dokploy, visit: https://dokploy.com/docs
