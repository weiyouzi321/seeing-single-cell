#!/bin/bash
export PATH="/Users/yiqi/.nvm/versions/node/v22.22.0/bin:$PATH"
cd /Users/yiqi/seeing-single-cell
npm run dev > server.log 2>&1 &
echo $! > .server.pid
