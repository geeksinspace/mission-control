#!/bin/bash
# Clone the core

# Check we have git
GIT="$(which git)"
[ ! -x "$GIT" ] && echo "Git not installed, cannot clone core" && exit 1

# Clone it
echo "GIS MC core is missing!"
echo "Cloning core repo....."
echo "=========================="
$GIT clone http://github.com/geeksinspace/mc-core $GIS_MC_HOME/lib/core
echo "=========================="

# Symlink the config file
ln -s ../../../etc/core.conf $GIS_MC_HOME/lib/core/etc/bot.conf

