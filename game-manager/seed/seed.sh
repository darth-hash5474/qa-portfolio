#!/bin/bash
# Mongo runs this once, the first time it starts with an empty data volume
mongoimport --db game-manager --collection games --jsonArray --file /seed/games.json
