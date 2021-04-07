# Score Voting

## Purpose

See `src/frontpage.js`.

## Building

Here's an example Dockerfile:

```Dockerfile
FROM debian:latest AS base
RUN DEBIAN_FRONTEND=noninteractive apt-get -qy update && DEBIAN_FRONTEND=noninteractive apt-get -qy install git curl && rm -rf /var/lib/apt/lists/*
WORKDIR /root

FROM base AS build
RUN git clone https://github.com/svenssonaxel/score-voting.git
WORKDIR /root/score-voting
RUN ./script build

FROM base
RUN mkdir -p /var/local/score-voting
COPY --from=build /root/score-voting/dist /usr/local/score-voting
EXPOSE 80
WORKDIR /usr/local/score-voting
CMD ["./service.sh"]
```

State is saved in `/var/local/score-voting` and the service listens to port `80`.

## Serving

You probably want a reverse proxy to add TLS.
Make sure to support websocket forwarding for paths beginning with `/realtimecmdsfor/`.
An nginx example:

```
location /realtimecmdsfor/ {
    proxy_pass http://score-voting/realtimecmdsfor/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
location / {
    proxy_pass http://score-voting/;
}
```
