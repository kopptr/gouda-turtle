#!/bin/bash

cd chrome
zip -r gtdict.jar content/ locale/ skin/
cd ..
zip -r gtdict.xpi chrome/ defaults/ chrome.manifest install.rdf
