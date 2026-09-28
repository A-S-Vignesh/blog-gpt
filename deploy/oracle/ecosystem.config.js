/**
 * PM2 process file for TheBlogGPT on the Oracle VM.
 * Started by deploy/oracle/deploy.sh; see docs/DEPLOY-ORACLE.md.
 */
module.exports = {
  apps: [
    {
      name: "thebloggpt",
      // Symlink to the live release; deploy.sh flips it on every deploy.
      cwd: "/home/ubuntu/blog-gpt-current",
      script: "server.js",
      // Production secrets live only on the server, next to the git checkout.
      node_args: "--env-file=/home/ubuntu/blog-gpt/.env",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        // Loopback only: Nginx is the single way in. Set explicitly because
        // the standalone server binds to $HOSTNAME, which shells often define.
        HOSTNAME: "127.0.0.1",
      },
      // One fork-mode process on purpose. The ISR / unstable_cache store and
      // revalidation are per process, so a second instance would keep serving
      // pages the first one had already revalidated. It also leaves the other
      // core to the chat API on this shared 2-core box.
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "1G",
      time: true,
    },
  ],
};
