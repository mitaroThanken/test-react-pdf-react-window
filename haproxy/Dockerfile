FROM golang:latest AS certs

# Virtual host's FQDN
ARG VHOST_FQDN=test.test

# Install minica
RUN go install github.com/jsha/minica@v1.0.2

# Make certs
RUN mkdir -p /certs \
    && cd /certs \
    && minica --domains ${VHOST_FQDN}\
    && openssl x509 -inform PEM -in minica.pem -out minica.crt \
    && cd ${VHOST_FQDN} \
    && cat cert.pem key.pem > ${VHOST_FQDN}.pem \
    && cd .. \
    && chmod go-rwx -R .

FROM haproxy:2.7 AS haproxy

# Virtual host's FQDN
ARG VHOST_FQDN=test.test

# be root
USER root

# Copy certs
COPY --from=certs /certs /usr/local/etc/haproxy/certs

# Copy config
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

# replace to Virtual host's FQDN
RUN sed -i -e s/test.test/${VHOST_FQDN}/g /usr/local/etc/haproxy/haproxy.cfg

# chown
RUN chown -R haproxy:haproxy /usr/local/etc/haproxy

# be haproxy
USER haproxy
