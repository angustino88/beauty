# Security headers of the responses served by this nginx. A location that adds any header loses the inherited
# ones, so every such location includes this file. $hsts_header is empty in development.
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header X-Frame-Options SAMEORIGIN always;
add_header Strict-Transport-Security $hsts_header always;
