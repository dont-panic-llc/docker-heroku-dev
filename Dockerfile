FROM heroku/heroku:18-build

# Which version of node?
ENV NODE_ENGINE 10.15.0
# Locate our binaries
ENV PATH /app/heroku/node/bin/:/app/user/node_modules/.bin:$PATH

# Create some needed directories
RUN mkdir -p /app/heroku/node /app/.profile.d
WORKDIR /app/user

# Install node
RUN curl -s https://s3pository.heroku.com/node/v$NODE_ENGINE/node-v$NODE_ENGINE-linux-x64.tar.gz | tar --strip-components=1 -xz -C /app/heroku/node

# Export the node path in .profile.d
RUN echo "export PATH=\"/app/heroku/node/bin:/app/user/node_modules/.bin:\$PATH\"" > /app/.profile.d/nodejs.sh

ADD package.json /app/user/
RUN /app/heroku/node/bin/npm i -g nodemon
RUN /app/heroku/node/bin/npm install
ADD . /app/user/

EXPOSE 3000 9229
