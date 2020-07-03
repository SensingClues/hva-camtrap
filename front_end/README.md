# Project

This project is build using the `React` framework using `yarn` as its package manager.

## Lint and pretty

The project layout and styling is based on `eslint` and `pretty`.
Make sure your eslint package is working properly and is integrated in your IDE, and the code is formatted
using prettylint.

To manualy check the state of these linters run:

1. `yarn lint` To run the code syntaxis linter.
2. `yarn prettylint` To run the code style linter.

# Setup

## prerequisites

1. To run the project make sure `node` `v10.16.3` or higher is installed.
2. Install `yarn` on your system.
   - Yarn is the package manager used to update and install all the libraries used for the project.
3. Navigate to the project home folder `front_end` and run `yarn install`.
   - This will install the libraries used in the project.

## Run project

To run the project, simply run `yarn start` in the project home folder.

# Updates and error handling

## Error handling

In some rare cases you may notice that the project won't load properly, won't start or something similar.
Somtimes it helps to re install the libraries.

1. Delete the `node_modules` folder and the `yarn.lock` file.
2. Run step 3 of the `prerequisites`.

## Updating

To keep the project up to date and working properly, please check the libraries used in the `package.json` file.
The most important libraries to keep up to date are the libs found under `dependencies`.
