#!/usr/bin/env bash
BRANCH=master
TARGET_REPO=webf-zone/webf-zone.github.io.git
DIST_FOLDER=dist

echo -e "Testing travis-encrypt"
echo -e "$VARNAME"

if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
    echo -e "Starting to deploy to Github Pages\n"
    if [ "$TRAVIS" == "true" ]; then
        git config --global user.email "travis@travis-ci.org"
        git config --global user.name "Travis-ci"
    fi
    #using token clone gh-pages branch
    git clone --quiet --branch=$BRANCH https://${GH_TOKEN}@github.com/$TARGET_REPO target_repo_clone > /dev/null
    #go into directory and copy data we're interested in to that directory
    cd target_repo_clone
    #rsync -rv --exclude=.git  ../$DIST_FOLDER/* .
	rsync -rv --exclude=.git --delete ../$DIST_FOLDER/ ./
    #add, commit and push files
    git add --all
    git commit -m "Travis build $TRAVIS_BUILD_NUMBER pushed to Github Pages"
    git push -fq origin $BRANCH > /dev/null
    echo -e "Deploy completed\n"
fi