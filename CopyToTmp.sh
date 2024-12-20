#!/bin/bash

# Ensure the target directory exists
mkdir -p /tmp/ahb-tabellen/pulumi

# Remove all entries in the pulumi directory except the venv folder. This avoids the need to reinstall the python packages for each deployment.
find /tmp/ahb-tabellen/pulumi -mindepth 1 -not -path "/tmp/ahb-tabellen/pulumi/venv*" -exec rm -rf {} +

# Copy all pulumi files to the pulumi directory. We need only pulumi here, cause the application code is already in the docker image which lives in the GitHub Container Registry (GHCR).
cp -R ./pulumi/* /tmp/ahb-tabellen/pulumi
