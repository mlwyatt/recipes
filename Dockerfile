# Development dockerfile
FROM ruby:3.3.4

ENV NODE_MAJOR=26
ENV COREPACK_VERSION=0.36.0

# https://github.com/nodesource/distributions#installation-instructions
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings &&  \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install nodejs -y

# Use corepack to manage yarn (no longer bundled with Node.js 25+)
RUN npm install -g corepack@$COREPACK_VERSION && \
    corepack enable && \
    apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    vim \
    htop

# Disable corepack download prompt (yarn downloaded on first yarn command)
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

ENV APP_PATH="Recipes"
WORKDIR /$APP_PATH

ENV PID_FOLDER="/$APP_PATH/tmp/pids"
ENV BUNDLER_VERSION=2.5.15

RUN bundle config set with development
RUN gem install bundler -v $BUNDLER_VERSION

# Remove any tmp/pids/server.pid with every container start up
COPY entrypoint.sh /$APP_PATH
RUN cp /$APP_PATH/entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

RUN mkdir /$APP_PATH/bin

CMD ["rails", "s", "-b", "0.0.0.0"]
