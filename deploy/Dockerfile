FROM nginx:alpine

MAINTAINER Samuel Gratzl <samuel.gratzl@datavisyn.io>

RUN apk --update add python py-pip openssl ca-certificates py-openssl wget
RUN apk --update add --virtual build-dependencies libffi-dev openssl-dev python-dev py-pip build-base \
  && pip install --upgrade pip \
  && pip install -r requirements.txt \
  && apk del build-dependencies

ENV PHOVEA_API_SERVER=api
ENV PHOVEA_NGINX_PORT=80
COPY ./deploy/nginx-default.conf /etc/nginx/conf.d/default.conf
CMD sed -i -e "s/PHOVEA_API_SERVER/${PHOVEA_API_SERVER-api}/g" /etc/nginx/conf.d/default.conf && sed -i -e "s/PHOVEA_NGINX_PORT/${PHOVEA_NGINX_PORT-api}/g" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
COPY ./build /usr/share/nginx/html
