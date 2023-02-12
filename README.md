HAProxy with jsha/minica
===

Modify virtual host's name
---

Edit `VHOST_NAME` in `.env` file.

Export certs
---

```shell
docker container cp haproxy-with-minica-haproxy-1:/usr/local/etc/haproxy/certs - | tar xv
```

Install trusted root certification
---

Install `certs/minica.crt` to Trusted Root Certification Authorities.

(WIP)
