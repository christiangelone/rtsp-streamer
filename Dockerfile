FROM mwader/static-ffmpeg:4.1.4 as ffmpeg
FROM node:8-alpine

COPY --from=ffmpeg /ffmpeg /ffprobe /usr/local/bin/

WORKDIR /usr/src/streamer

COPY package.json .
RUN npm install

COPY . .

EXPOSE 24000-24999
EXPOSE 3333
CMD [ "npm", "start" ]