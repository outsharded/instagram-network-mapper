# instagram-network-mapper
Project to create a network map of freinds on Instagram.

## WARNING
Using automation on your account is against Instagram ToS. The code does attempt to deal with and prevent soft bans and rate limits, but be cautious.

## Installation
You need:
- [node.js + npm](https://nodejs.org/en)
- [Gephi](https://gephi.org)

Install node.js and clone the repo.
In your prefered Terminal/CLI run:
npm i
npm run map

Login as prompted and allow the scraper to run.

## Note on running
The scraper runs two mutuals deep, ie:
You > Your Freinds > Their Freinds

This may lead to thousands of accounts being scanned, and this may take a long time. The program is designed to be started and stopped without losing data as everything is constantly saved in a database.

Once the gexf is output, find and open it with Gephi. I suggest using ForceAtlas 2, and filtering the Topology>Degree>2+, to map connections, rather than end nodes.
