# Static single-page app (the Vite build in /usr/share/nginx/html).

root /usr/share/nginx/html;
index index.html;

# Hashed build assets never change: cache for a year.
location /assets/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
    include /etc/nginx/snippets/security-headers.inc;
}

location /static/ {
    return 404;
}

# The app shell is never cached, so a deploy is picked up on the next load.
location = /index.html {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    include /etc/nginx/snippets/security-headers.inc;
}

# Client-side routes fall back to the app shell.
location / {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    include /etc/nginx/snippets/security-headers.inc;
    try_files $uri /index.html;
}
